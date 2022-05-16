import type { StorageMetaIndex, Serializable } from './types';

/**
 * 表示异步存储器的接口。
 */
export interface AsyncStorage {
  /**
   * 获取此存储提供者实例的名称。
   */
  readonly instanceName: string;

  /**
   * 返回指定键对应的值。
   * 如果指定键不存在，则返回 `defaultValue` 的值。
   *
   * @param key 指定的键。
   * @param defaultValue 指定默认值，当指定键不存在时返回，建议默认为 `undefined`。
   */
  getItem(
    key: string,
    defaultValue?: Maybe<Serializable>,
  ): Promise<Maybe<Serializable>>;

  /**
   * 返回一个用于描述当前存储器中所有项的元数据索引。
   */
  getMetaIndex(): Promise<StorageMetaIndex>;

  /**
   * 返回该存储提供者中所有键的列表。
   */
  keys(): Promise<string[]>;

  /**
   * 设置指定键的值。
   * @param key 指定的键。
   * @param value 指定键对应的值。
   * @returns 返回 `value` 的哈希值。
   */
  setItem(key: string, value: Serializable): Promise<string>;

  /**
   * 移除指定键对应的项。
   */
  removeItem(key: string): Promise<void>;
}
