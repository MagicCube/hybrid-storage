/**
 * 表示所有原始值的类型。
 */
export type PrimitiveValue = string | number | boolean;

/**
 * 表示可序列化的类型，包含字符串、数字、布尔值和 `Null`，以及递归包含上述类型为元素的数组和对象。
 */
export type Serializable =
  | Nullable<PrimitiveValue>
  | Array<MaybeNullable<Serializable>>
  | { [key: string]: MaybeNullable<Serializable> };
