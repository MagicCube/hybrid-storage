import type { Serializable, Serializer } from '@/serializing';
import { JSONSerializer } from '@/serializing';
import { hash } from '@/util/hash';

import type { AsyncStorage } from '../AsyncStorage';
import type { StorageMetaIndex } from '../StorageMetaIndex';

/**
 * 为浏览器内置的 `LocalStorage` 实现的异步存储器类。
 *
 * @implements
 * 该类实现了 {@link AsyncStorage} 接口。
 */
export class AsyncLocalStorage implements AsyncStorage {
  private _serializer: Serializer = new JSONSerializer();
  private _storage: Storage;

  /**
   * 创建 `AsyncLocalStorage` 类的新实例。
   * @param instanceName 指定存储器的实例名称。
   */
  constructor(readonly instanceName: string) {
    this._storage = window.localStorage;
  }

  /**
   * @inheritdoc
   */
  async getItem(
    key: string,
    defaultValue: Maybe<Serializable> = undefined,
  ): Promise<Maybe<Serializable>> {
    return this.getItemSync(key, defaultValue);
  }

  /**
   * 以同步的方式返回指定键对应的值。
   * 如果指定键不存在，则返回 `defaultValue` 的值。
   *
   * @param key 指定的键。
   * @param defaultValue 指定默认值，当指定键不存在时返回，建议默认为 `undefined`。
   */
  getItemSync(key: string, defaultValue: Maybe<Serializable> = undefined) {
    const value = this._storage.getItem(this._getUniqueKey(key));

    if (value === null) {
      return defaultValue;
    }

    return this._serializer.deserialize(value);
  }

  /**
   * @inheritdoc
   */
  async setItem(key: string, value: Serializable) {
    if (value === undefined) {
      throw new Error('Undefined value is not allowed.');
    }
    return this._setItem(key, value, true);
  }

  /**
   * @inheritdoc
   */
  async getMetaIndex(): Promise<StorageMetaIndex> {
    const metaIndex = this.getItem('@meta', {}) as unknown as StorageMetaIndex;
    return metaIndex;
  }

  /**
   * @inheritdoc
   */
  async keys() {
    const keys = await this.getMetaIndex();
    return Object.keys(keys);
  }

  /**
   * @inheritdoc
   */
  async removeItem(key: string) {
    this._storage.removeItem(this._getUniqueKey(key));
    // Update meta index
    const metaIndex = await this.getMetaIndex();
    delete metaIndex[key];
    this._setMetaIndex(metaIndex);
  }

  private _getUniqueKey(key: string) {
    return `${this.instanceName}/${key}`;
  }

  private async _setItem(
    key: string,
    value: Serializable,
    updateIndex: boolean,
  ) {
    const jsonString = this._serializer.serialize(value);
    this._storage.setItem(this._getUniqueKey(key), jsonString);
    // Compute hash
    const etag = hash(jsonString);
    if (updateIndex) {
      const metaIndex = await this.getMetaIndex();
      metaIndex[key] = { etag };
      this._setMetaIndex(metaIndex);
    }
    return etag;
  }

  private _setMetaIndex(metaIndex: StorageMetaIndex) {
    this._setItem('@meta', metaIndex, false);
  }
}
