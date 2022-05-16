type Nullable<T> = T | null;

type Maybe<T> = T | undefined;

type MaybeNullable<T> = T | null | undefined;

type Synchronize<T> = T extends (...args: infer P) => Promise<infer R>
  ? (...args: P) => R
  : T;
