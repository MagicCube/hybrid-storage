import type { Serializable } from './Serializable';

/**
 * 表示序列化器的通用接口。
 */
export interface Serializer<T = string> {
  /**
   * 将指定的值序列化为 T 类型。
   * @param value 指定要被序列化的值。
   */
  serialize(value: Serializable): T;

  /**
   * 将指定的 T 类型反向序列化为对应的值。
   * @param value 指定要被反向序列化的值。
   */
  deserialize(value: T): Serializable;
}
