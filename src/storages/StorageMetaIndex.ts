/**
 * 表示存储元数据索引的结构体。
 */
export interface StorageMetaIndex {
  [key: string]: {
    /**
     * 存储对象的 etag 标签值。
     *
     * 该值通常为存储对象的内容的 MD5 哈希值。
     */
    etag: string;
  };
}
