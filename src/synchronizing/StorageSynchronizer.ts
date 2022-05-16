import { logger } from '@/logging';
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
    const instanceName = this.localStorage.instanceName;
    this._commitQueue = new AsyncQueue<SyncCommit>(
      instanceName,
      this._handleQueuedCommit,
      this._handleQueuedCommitError,
    );
  }

  /**
   * 将指定的本地变更提交到变更队列，并尝试立刻推送至云端。
   * @param commit 需要提交的本地变更。
   * @param autoPushAfterCommit 指定是否在提交成功后，立即推送本地变更至云端。默认为 `true`。
   */
  async commitLocalChange(commit: SyncCommit, autoPushAfterCommit = true) {
    await this._commitQueue.enqueue(commit, autoPushAfterCommit);
  }

  /**
   * 将远程存储器的数据变更（如果有）拉到本地存储器。
   */
  async pull() {
    logger.beginGroup('Pulling');
    logger.info('Downloading meta index from remote...');
    const remoteIndex = await this.remoteStorage.getMetaIndex();
    const localIndex = await this.localStorage.getMetaIndex();
    logger.info('Comparing...');
    const patches = this._generatePatches(localIndex, remoteIndex);
    logger.info('Apply patches...', patches);
    await this._applyCommits(patches);
    logger.endGroup('Done pulling');
  }

  /**
   * 尝试将变更队列中的数据推送到远程存储器。
   */
  async push() {
    logger.beginGroup('Pushing');
    await this._commitQueue.run();
    logger.endGroup('Done pushing');
  }

  /**
   * 发起本地与远程之间的同步。
   *
   * 此方法先将调用 `pull()` 从云端更新数据到本地，然后再调用 `push()` 将本地的变更推送到云端。
   */
  async synchronize() {
    logger.beginGroup('Synchronizing');
    await this.pull();
    await this.push();
    logger.endGroup('Done synchronizing');
  }

  private async _applyCommit(commit: SyncCommit) {
    logger.info('Committing', commit);

    const sourceStorage =
      commit.target === 'remote' ? this.localStorage : this.remoteStorage;
    const targetStorage =
      commit.target === 'local' ? this.localStorage : this.remoteStorage;
    switch (commit.type) {
      case 'set':
        await sourceStorage.setItem(commit.key, commit.value);
        await targetStorage.setItem(commit.key, commit.value);
        break;
      case 'update':
        const value = await sourceStorage.getItem(commit.key);
        if (value) {
          await targetStorage.setItem(commit.key, value);
        }
        break;
      case 'remove':
        await targetStorage.removeItem(commit.key);
        await sourceStorage.removeItem(commit.key);
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
          reason: 'remote-removed',
          staging: 'patching',
        });
      } else if (remote[key].etag !== value.etag) {
        patches.push({
          target: 'local',
          type: 'update',
          key,
          reason: 'remote-updated',
          staging: 'patching',
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
          reason: 'remote-added',
          staging: 'patching',
        });
      }
    }
    return patches;
  }

  private _handleQueuedCommit = async (commit: SyncCommit) => {
    await this._applyCommit(commit);
  };

  private _handleQueuedCommitError = async (
    commit: SyncCommit,
    error: Error,
  ) => {
    logger.warn(`Failed to commit`, commit, error);
  };
}
