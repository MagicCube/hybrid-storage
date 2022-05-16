import type { Serializable } from './Serializable';
import type { Serializer } from './Serializer';

/**
 * 表示 JSON 序列化器的类。
 */
export class JSONSerializer implements Serializer {
  /**
   * 将指定的值序列化为 JSON 字符串。
   * @param value 指定要被序列化的值。
   */
  serialize(value: Serializable): string {
    return JSON.stringify(value);
  }

  /**
   * 将指定 JSON 字符串反向序列化为对应的值。
   * @param jsonString 指定要被反向序列化的 JSON 字符串。
   */
  deserialize(jsonString: string): Serializable {
    return JSON.parse(jsonString);
  }
}
