import type { default as SchemaType, SchemaOptions } from '@/schematype';
import type { LeafValueTypes, ValueType, ValueObject, SchemaInstance } from '@/types';
import type Document from '@/document';

export type BuiltinConstructors =
  typeof String | typeof Number | typeof Boolean | typeof Array |
  typeof Object | typeof Date | typeof Buffer;

export type WrappedBuiltinConstructors =
  { type: BuiltinConstructors; };

export type SchemaTypeDefinition =
  { type: typeof SchemaType } & SchemaOptions;

export type SchemaBuiltinsDefinition =
  BuiltinConstructors | WrappedBuiltinConstructors;

export type SchemaDefinitionItem =
  Recursive<SchemaTypeDefinition | SchemaBuiltinsDefinition>;

export type SchemaDefinition =
  Dict<SchemaDefinitionItem>;

export interface QuerySpecial {
  $where?: (this: ValueObject) => boolean;
  $and?: QueryDefinition[];
  $or?: QueryDefinition[];
  $nor?: QueryDefinition[];
  $not?: QueryDefinitionObject;
}

export type QuerySpecialDefinition<T extends keyof QuerySpecial> =
  Exclude<QuerySpecial[T], undefined>;

export type QueryDefinition =
  Recursive<LeafValueTypes | QuerySpecial>;

export type QueryDefinitionObject =
  RecursiveObject<LeafValueTypes | QuerySpecial>;

/**
 * @callback queryFilterCallback
 * @param {*} data
 * @return {boolean}
 */
export type QueryFilterCallback =
  (data: Document) => boolean;

/**
 * @callback queryCallback
 * @param {*} data
 * @return {void}
 */
export type QueryCallback<TData = ValueType> =
  (data: TData) => void;

/**
 * @callback queryParseCallback
 * @param {*} a
 * @param {*} b
 * @returns {*}
 */
export type QueryParseCallback =
  (a: Document, b: Document) => number;

type ResolveSchema<T extends SchemaDefinitionItem> =
  T extends BuiltinConstructors ? InstanceType<T> :
  T extends WrappedBuiltinConstructors ? InstanceType<T['type']> :
  T extends { type: new(...args: unknown[]) => infer SType } ?
    SType extends SchemaType ? SchemaInstance<SType> : never :
  ResolveComplexSchema<T>;

type ResolveComplexSchema<T extends SchemaDefinitionItem> =
  T extends Array<infer U> ? {
    0: T;
    1: U extends SchemaDefinitionItem ? ResolveSchema<U>[] : never;
  }[U extends SchemaDefinitionItem ? 1 : 0] :
  T extends SchemaDefinition ? ResolvedSchemaDefinition<T> : never;

type ResolvedSchemaDefinition<T extends SchemaDefinition> =
  { [K in keyof T]: ResolveSchema<T[K]>; }
