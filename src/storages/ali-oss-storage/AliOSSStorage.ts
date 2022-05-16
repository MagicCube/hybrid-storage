import type OSS from 'ali-oss';

import type { Serializable, StorageMetaIndex } from '@/types';

import type { AsyncStorage } from '../AsyncStorage';

/**
 * 为阿里云 OSS 存储服务实现的异步存储器类。
 *
 * @implements
 * 该类实现了 {@link AsyncStorage} 接口。
 */
export class AliOSSStorage implements AsyncStorage {
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
    try {
      const fileName = this._getFileName(key);
      const { content } = await this.oss.get(fileName);
      const jsonString = content.toString();
      const result = JSON.parse(jsonString);
      return result;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * @inheritdoc
   */
  async setItem(key: string, value: Serializable): Promise<string> {
    const jsonString = JSON.stringify(value);
    const buffer = new Blob([jsonString], { type: 'application/json' });
    const fileName = this._getFileName(key);
    const result = await this.oss.put(fileName, buffer);
    const { etag: etagWithDoubleQuotes } = result.res.headers as {
      etag: string;
    };
    return dropQuotes(etagWithDoubleQuotes);
  }

  /**
   * @inheritdoc
   */
  async getMetaIndex(): Promise<StorageMetaIndex> {
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

  _getFileName(key: string): string {
    return `${this.instanceName}/${key}.json`;
  }

  _getKeyFromFileName(fileName: string) {
    return fileName
      .substring(this.instanceName.length + 1)
      .replace(/\.json$/, '');
  }
}

function dropQuotes(etagWithQuotes: string) {
  return etagWithQuotes.replace(/"/g, '');
}
