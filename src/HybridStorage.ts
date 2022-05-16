import type OSS from 'ali-oss';

import type { Serializable } from '@/serializing';
import type { AsyncStorage } from './storing';
import { AliOSSStorage, AsyncLocalStorage } from './storing';
import { StorageSynchronizer, SyncState } from './synchronizing';

/**
 * `HybridStorage` 是一种可在本地离线与云端之间同步 JSON 对象的存储器。
 */
export class HybridStorage implements AsyncStorage {
  private _syncState: SyncState = SyncState.Initialized;

  private _localStorage: AsyncLocalStorage;
  private _remoteStorage: AliOSSStorage;
  private _synchronizer: StorageSynchronizer;

  /**
   * 创建 `HybridStorage` 类的新实例。
   * @param instanceName 指定存储实例的唯一名称。
   */
  constructor(readonly instanceName: string, oss: OSS) {
    this._localStorage = new AsyncLocalStorage(instanceName);
    this._remoteStorage = new AliOSSStorage(instanceName, oss);
    this._synchronizer = new StorageSynchronizer(
      this._localStorage,
      this._remoteStorage,
    );
    this.synchronize();
  }

  /**
   * 获取此存储器当前的同步状态。
   */
  get syncState() {
    return this._syncState;
  }

  /**
   * @inheritdoc
   */
  getMetaIndex() {
    return this._localStorage.getMetaIndex();
  }

  /**
   * @inheritdoc
   */
  keys() {
    return this._localStorage.keys();
  }

  /**
   * @inheritdoc
   */
  getItem(key: string, defaultValue: Serializable | undefined = undefined) {
    return this._localStorage.getItem(key, defaultValue);
  }

  /**
   * @inheritdoc
   */
  async setItem(key: string, value: Serializable) {
    const etag = await this._localStorage.setItem(key, value);
    await this._synchronizer.commitLocalChange({
      type: 'set',
      target: 'remote',
      key,
      value,
      reason: 'local-updated',
      staging: 'queued',
    });
    return etag;
  }

  /**
   * @inheritdoc
   */
  async removeItem(key: string): Promise<void> {
    await this._localStorage.removeItem(key);
    await this._synchronizer.commitLocalChange({
      type: 'remove',
      target: 'remote',
      key,
      reason: 'local-removed',
      staging: 'queued',
    });
  }

  /**
   * 发起本地与远程之间的同步。
   */
  async synchronize() {
    this._syncState = SyncState.Synchronizing;
    try {
      await this._synchronizer.synchronize();
      this._syncState = SyncState.Synchronized;
    } catch (e) {
      this._syncState = SyncState.Failed;
    }
  }
}
