/**
 * 泛型工具类：返回可为 `null` 的 `T` 类型。
 */
type Nullable<T> = T | null;

/**
 * 泛型工具类：返回可为 `undefined` 的 `T` 类型。
 */
type Maybe<T> = T | undefined;

/**
 * 泛型工具类：返回可为 `null` 或 `undefined` 的 `T` 类型。
 */
type MaybeNullable<T> = T | null | undefined;

/**
 * 泛型工具类：将一个返回值为 `Promise<T>` 的函数，转换为返回值为 `T` 类型的函数。
 */
type Unpromisify<T> = T extends (...args: infer P) => Promise<infer R>
  ? (...args: P) => R
  : T;
