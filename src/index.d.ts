type Any<T = unknown> = Record<string, T>;

interface RecursiveImpl<T> {
  [key: string]: T | RecursiveImpl<T>;
}

type Recursive<T extends Any> = T | RecursiveImpl<T>;

type ValueOf<T> = T[keyof T];
