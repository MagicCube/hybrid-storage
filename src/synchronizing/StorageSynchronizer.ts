import type { AsyncStorage, StorageMetaIndex } from '@/storages';

import type { SyncOperation } from './SyncOperation';

/**
 * 表示存储同步器的类，用于在本地及云端存储器之间进行数据同步。
 */
export class StorageSynchronizer {
  private _changes: SyncOperation[] = [];

  /**
   * 根据指定的本地与远程存储器创建同步器 `StorageSynchronizer` 类的新实例。
   */
  constructor(
    readonly localStorage: AsyncStorage,
    readonly remoteStorage: AsyncStorage,
  ) {
    this.localStorage.getItem('@changes', []).then((changes) => {
      this._changes = (changes as unknown as SyncOperation[]) || [];
    });
  }

  /**
   * 将指定的本地变更提交到变更队列，并尝试立刻执行 `push()` 方法推送至服务端。
   * @param change 需要提交的本地变更。
   * @param autoPushAfterCommit 指定是否在提交后立即调用 `push()` 方法推送本地变更至服务器。默认为 `true`。
   */
  async commitChange(change: SyncOperation, autoPushAfterCommit = true) {
    this._changes.push(change);
    if (autoPushAfterCommit) {
      this.push(); // 无需等待结果
    }
  }

  /**
   * 将远程存储器的数据变更（如果有）拉到本地存储器。
   */
  async pull() {
    const remoteIndex = await this.remoteStorage.getMetaIndex();
    const localIndex = await this.localStorage.getMetaIndex();
    const patches = this._generatePatches(localIndex, remoteIndex);
    this._applyOperations(patches);
  }

  /**
   * 尝试将变更队列中的数据推送到远程存储器。
   */
  async push() {
    while (this._changes.length) {
      const operation = this._changes[0];
      await this._applyOperation(operation);
      this._changes.shift();
    }
  }

  /**
   * 发起本地与远程之间的同步。
   *
   * 此方法先将调用 `pull()` 从服务端更新数据到本地，然后再调用 `push()` 将本地的变更推送到服务端。
   */
  async synchronize() {
    await this.pull();
    await this.push();
  }

  private async _applyOperation(operation: SyncOperation) {
    const sourceStorage =
      operation.target === 'remote' ? this.localStorage : this.remoteStorage;
    const targetStorage =
      operation.target === 'local' ? this.localStorage : this.remoteStorage;
    switch (operation.type) {
      case 'remove':
        await targetStorage.removeItem(operation.key);
        break;
      case 'update':
        const value = await sourceStorage.getItem(operation.key);
        if (value) {
          await targetStorage.setItem(operation.key, value);
        }
        break;
    }
  }

  private async _applyOperations(operations: SyncOperation[]) {
    for (const operation of operations) {
      this._applyOperation(operation);
    }
  }

  private _generatePatches(
    local: StorageMetaIndex,
    remote: StorageMetaIndex,
  ): SyncOperation[] {
    const operations: SyncOperation[] = [];

    // 查找远程存储器中已经不存在的项及更改过的项。
    for (const [key, value] of Object.entries(local)) {
      if (!remote[key]) {
        operations.push({
          target: 'local',
          type: 'remove',
          key,
        });
      } else if (remote[key].etag !== value.etag) {
        console.info(remote[key].etag, value.etag);
        operations.push({
          target: 'local',
          type: 'update',
          key,
        });
      }
    }

    // 查找新增的项。
    for (const key of Object.keys(remote)) {
      if (!local[key]) {
        operations.push({
          target: 'local',
          type: 'update',
          key,
        });
      }
    }
    return operations;
  }
}
