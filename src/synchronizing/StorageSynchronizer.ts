import { AsyncQueue } from '@/queuing';
import type { AsyncStorage, StorageMetaIndex } from '@/storing';

import type { SyncCommit } from './SyncCommit';

/**
 * 表示存储同步器的类，用于在本地及云端存储器之间进行数据同步。
 */
export class StorageSynchronizer {
  private _commitQueue: AsyncQueue<SyncCommit>;

  /**
   * 根据指定的本地与远程存储器创建同步器 `StorageSynchronizer` 类的新实例。
   */
  constructor(
    readonly localStorage: AsyncStorage & {
      getItemSync: Unpromisify<AsyncStorage['getItem']>;
    },
    readonly remoteStorage: AsyncStorage,
  ) {
    this._commitQueue = new AsyncQueue<SyncCommit>(
      localStorage,
      this._handleQueuedCommit,
    );
  }

  /**
   * 将指定的本地变更提交到变更队列，并尝试立刻执行 `push()` 方法推送至服务端。
   * @param commit 需要提交的本地变更。
   * @param autoPushAfterCommit 指定是否在提交后立即调用 `push()` 方法推送本地变更至服务器。默认为 `true`。
   */
  async commitLocalChange(commit: SyncCommit, autoPushAfterCommit = true) {
    await this._commitQueue.enqueue(commit, autoPushAfterCommit);
  }

  /**
   * 将远程存储器的数据变更（如果有）拉到本地存储器。
   */
  async pull() {
    const remoteIndex = await this.remoteStorage.getMetaIndex();
    const localIndex = await this.localStorage.getMetaIndex();
    const commits = this._generatePatches(localIndex, remoteIndex);
    await this._applyCommits(commits);
  }

  /**
   * 尝试将变更队列中的数据推送到远程存储器。
   */
  async push() {
    await this._commitQueue.run();
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

  private async _applyCommit(commit: SyncCommit) {
    const sourceStorage =
      commit.target === 'remote' ? this.localStorage : this.remoteStorage;
    const targetStorage =
      commit.target === 'local' ? this.localStorage : this.remoteStorage;
    switch (commit.type) {
      case 'remove':
        await targetStorage.removeItem(commit.key);
        break;
      case 'update':
        const value = await sourceStorage.getItem(commit.key);
        if (value) {
          await targetStorage.setItem(commit.key, value);
        }
        break;
    }
  }

  private async _applyCommits(commits: SyncCommit[]) {
    for (const commit of commits) {
      await this._applyCommit(commit);
    }
  }

  private _generatePatches(
    local: StorageMetaIndex,
    remote: StorageMetaIndex,
  ): SyncCommit[] {
    const patches: SyncCommit[] = [];

    // 查找远程存储器中已经不存在的项及更改过的项。
    for (const [key, value] of Object.entries(local)) {
      if (!remote[key]) {
        patches.push({
          target: 'local',
          type: 'remove',
          key,
        });
      } else if (remote[key].etag !== value.etag) {
        console.info(remote[key].etag, value.etag);
        patches.push({
          target: 'local',
          type: 'update',
          key,
        });
      }
    }

    // 查找新增的项。
    for (const key of Object.keys(remote)) {
      if (!local[key]) {
        patches.push({
          target: 'local',
          type: 'update',
          key,
        });
      }
    }
    return patches;
  }

  private _handleQueuedCommit = async (commit: SyncCommit) => {
    await this._applyCommit(commit);
  };
}
