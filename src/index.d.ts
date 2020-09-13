/* eslint-disable @typescript-eslint/no-explicit-any */

type Any<T = unknown> = Record<string, T>;

interface RecursiveImpl<T> {
  [key: string]: T | RecursiveImpl<T>;
}

type Recursive<T extends Any> = T | RecursiveImpl<T>;

type ValueOf<T> = T[keyof T];

type AnyFunction =
  (...args: any[]) => any;

declare module 'JSONStream' {
  // types from module '@types/jsonstream' cannot be attached to JSONStream,
  // as npm does not allow upper case in package names. The package `JSONStream`
  // is uploaded before this constraint is put into effect.
  //
  // These types are copied from `@types/jsonstream`.

  export declare function parse<T>(pattern: T): NodeJS.ReadWriteStream;
  export declare function parse<T>(patterns: T[]): NodeJS.ReadWriteStream;
}
