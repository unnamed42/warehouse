import SchemaType, { SchemaOptions } from '@/schematype';
import type { ValueType } from '@/types';

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
  SchemaTypeDefinition | SchemaBuiltinsDefinition | (SchemaTypeDefinition | SchemaBuiltinsDefinition)[];

export type SchemaDefinition =
  Record<string, SchemaDefinitionItem>;


/**
 * @callback queryFilterCallback
 * @param {*} data
 * @return {boolean}
 */
export type QueryFilterCallback<TData> =
  (data: TData) => boolean;

/**
 * @callback queryCallback
 * @param {*} data
 * @return {void}
 */
export type QueryCallback<TData> =
  (data: TData) => void;

/**
 * @callback queryParseCallback
 * @param {*} a
 * @param {*} b
 * @returns {*}
 */
export type QueryParseCallback =
  (a: ValueType, b: ValueType) => number;
