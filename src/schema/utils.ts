import Bluebird from 'bluebird';
import { getProp } from '@/util';
import { Types, ValueType } from '@/types';

import SchemaType, { SchemaOptions } from '@/schematype';
import type { SortOrderSpec } from '@/query';
import type {
  SchemaTypeDefinition, SchemaBuiltinsDefinition, BuiltinConstructors,
  QueryParseCallback
} from './types';

const builtins = ['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Buffer'] as const;
const builtinTypes = new Set(builtins);

type BuiltinNames = (typeof builtins)[number];

const isBuiltinTypes = (type: BuiltinConstructors | typeof SchemaType): type is BuiltinConstructors =>
  builtinTypes.has(type.name as BuiltinNames);

export const getSchemaType = (
  name: string,
  options: SchemaTypeDefinition | SchemaBuiltinsDefinition
): SchemaType => {
  const Type = 'type' in options ? options.type : options;

  if (isBuiltinTypes(Type)) {
    return new Types[Type.name](name, options as SchemaOptions);
  }

  return new Type(name, options as SchemaOptions);
};

type Fn0<R> = () => Resolvable<R>;
type Fn1<T, R> = (arg: T) => Resolvable<R>;
type Fn2<T, R> = (arg: T, callback: (err: unknown, result?: R) => void) => void;

export function hookWrapper<R>(fn: Fn0<R>): () => Bluebird<R>;
export function hookWrapper<T, R>(fn: Fn1<T, R>): (arg: T) => Bluebird<R>;
export function hookWrapper<T, R>(fn: Fn2<T, R>): (arg: T) => Bluebird<R>;

export function hookWrapper<T, R>(
  fn: Fn0<R> | Fn1<T, R> | Fn2<T, R>
): (() => Bluebird<R>) | ((arg: T) => Bluebird<R>) {
  if (fn.length > 1) {
    return Bluebird.promisify(fn as Fn2<T, R>);
  }

  return Bluebird.method(fn as Fn0<R> | Fn1<T, R>);
}

export const execSortStack = (stack: QueryParseCallback[]): QueryParseCallback => {
  const len = stack.length;

  const callback: QueryParseCallback = (a, b) => {
    let result!: number;

    for (let i = 0; i < len; i++) {
      result = stack[i](a, b);
      if (result) break;
    }

    return result;
  };

  return callback;
};

export const sortStack = (path_: SchemaType | undefined, key: string, sort: SortOrderSpec): QueryParseCallback => {
  const path = path_ || new SchemaType(key);
  const descending = sort === 'desc' || sort === -1;

  const callback: QueryParseCallback = (a, b) => {
    const result = path.compare(getProp(a, key), getProp(b, key));
    return descending && result ? result * -1 : result;
  };

  return callback;
};
