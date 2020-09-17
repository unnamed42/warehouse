/* eslint-disable @typescript-eslint/no-explicit-any */

interface Dict<T> {
  [key: string]: T;
}

interface DictNullable<T> {
  [key: string]: T | undefined;
}

type Any = Record<string, unknown>;

type Resolvable<T> = T | PromiseLike<T>;

type Recursive<T, B extends boolean = false> =
  B extends true ? (T | RecursiveObject<T> | RecursiveArray<T>) : (T | RecursiveObject<T>);

interface RecursiveObject<T, HasArray extends boolean = true> extends Dict<Recursive<T, HasArray>> {}

interface RecursiveArray<T> extends Array<Recursive<T, true>> {}

type Constructor<T> =
  new(...args: any[]) => T;

type ValueOf<T> = T[keyof T];

type Keyof<T> =
  T extends any ? keyof T : never;

type AnyFunction =
  (...args: any[]) => any;
