import type OSS from 'ali-oss';

import type { Serializable, Serializer } from '@/serializing';
import { JSONSerializer } from '@/serializing';
import { dropQuotes } from '@/util/quote-string';

import type { AsyncStorage } from '../AsyncStorage';
import type { StorageMetaIndex } from '../StorageMetaIndex';

/**
 * 为阿里云 OSS 存储服务实现的异步存储器类。
 *
 * @implements
 * 该类实现了 {@link AsyncStorage} 接口。
 */
export class AliOSSStorage implements AsyncStorage {
  private _serializer: Serializer = new JSONSerializer();

  /**
   * 创建 `AliOSSStorage` 类的新实例。
   * @param instanceName 指定存储器的实例名称。
   * @param oss 指定的 {@link OSS} 类的实例。
   */
  constructor(readonly instanceName: string, readonly oss: OSS) {}

  /**
   * @inheritdoc
   */
  async getItem(
    key: string,
    defaultValue: Maybe<Serializable> = undefined,
  ): Promise<Maybe<Serializable>> {
    let jsonString: string;
    try {
      // 根据 `key` 获取文件名（含路径）
      const fileName = this._getFileName(key);
      // 从 OSS 服务中获取文件内容
      const { content } = await this.oss.get(fileName);
      jsonString = content.toString();
    } catch (e) {
      if (e instanceof Error && e.name === 'NoSuchKeyError') {
        // OSS 服务报告”NoSuchKeyError“错误，
        // 即文件路径不存在，则返回默认值
        return defaultValue;
      } else {
        // 其他的异常则原封未动的抛出
        throw e;
      }
    }
    // 将 JSON 字符串反序列化为值
    const result = this._serializer.deserialize(jsonString);
    return result;
  }

  /**
   * @inheritdoc
   */
  async setItem(key: string, value: Serializable): Promise<string> {
    if (value === undefined) {
      throw new Error('Undefined value is not allowed.');
    }
    // 序列化为 JSON 字符串
    const jsonString = this._serializer.serialize(value);
    // 封装为 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    // 根据 `key` 生成对应的文件名（含路径）
    const fileName = this._getFileName(key);
    // 执行上传，OSS 会自行决定是新建还是覆盖文件
    const result = await this.oss.put(fileName, blob);
    // 如果上传成功，则从 HTTP 响应头中获得 etag，并将其返回。
    const { etag: etagWithDoubleQuotes } = result.res.headers as {
      etag: string;
    };
    // 要注意的是 OSS SDK 返回的 etag 两头会各多一个英文引号，我们要去掉它们。
    return dropQuotes(etagWithDoubleQuotes);
  }

  /**
   * @inheritdoc
   */
  async getMetaIndex(): Promise<StorageMetaIndex> {
    // `list` 方法可以根据前缀，查询文件的元数据信息，
    // 其中就包含了 etag 信息。
    // 单次查询最多可一次性返回 1000 个文件的信息。
    const list = await this.oss.list(
      {
        prefix: `${this.instanceName}/`,
        'max-keys': 1000,
      },
      {},
    );
    return list.objects.reduce((result, obj) => {
      const key = this._getKeyFromFileName(obj.name);
      result[key] = { etag: dropQuotes(obj.etag) };
      return result;
    }, {} as StorageMetaIndex);
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
  async removeItem(key: string): Promise<void> {
    const fileName = this._getFileName(key);
    await this.oss.delete(fileName);
  }

  private _getFileName(key: string): string {
    return `${this.instanceName}/${key}.json`;
  }

  private _getKeyFromFileName(fileName: string) {
    return fileName
      .substring(this.instanceName.length + 1)
      .replace(/\.json$/, '');
  }
}
