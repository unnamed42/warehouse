export { default as Mixed } from '../schematype';
export { default as String } from './string';
export { default as Number } from './number';
export { default as Boolean } from './boolean';
export { default as Array } from './array';
export { default as Object } from './object';
export { default as Date } from './date';
export { default as Virtual } from './virtual';
export { default as CUID } from './cuid';
export { default as Enum } from './enum';
export { default as Integer } from './integer';
export { default as Buffer } from './buffer';

export type ValueType =
  // eslint-disable-next-line @typescript-eslint/ban-types
  number | string | boolean | Buffer | Any |
  ValueType[];

export interface SchemaNode<T extends ValueType, Query = unknown> {

  /**
   * Casts data. This function is used by getters to cast an object to document
   * instances. If the value is null, the default value will be returned.
   *
   */
  cast(value: ValueType | null, data?: unknown): T;

  /**
   * Validates data. This function is used by setters.
   *
   */
  validate(value: ValueType | null, data?: unknown): T | null;

  /**
   * Compares data. This function is used when sorting.
   *
   */
  compare<T>(a: T, b: T): Order;

  /**
   * Parses data. This function is used when restoring data from database files.
   *
   */
  parse(value: ValueType, data?: unknown): T;

  /**
   * Transforms value. This function is used when saving data to database files.
   *
   */
  value(value: ValueType, data?: unknown): T;

  /**
   * Checks the equality of data.
   *
   */
  match(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks the existance of data.
   *
   */
  q$exist (value: ValueType, query: Query, data?: unknown): boolean;
  q$exists(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks the equality of data. Returns true if the value doesn't match.
   *
   */
  q$ne(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks whether `value` is less than (i.e. <) the `query`.
   *
   */
  q$lt(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks whether `value` is less than or equal to (i.e. <=) the `query`.
   *
   */
  q$lte(value: ValueType, query: Query, data?: unknown): boolean;

  q$max(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks whether `value` is greater than (i.e. >) the `query`.
   *
   */
  q$gt(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks whether `value` is greater than or equal to (i.e. >=) the `query`.
   *
   */
  q$gte(value: ValueType, query: Query, data?: unknown): boolean;

  q$min(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks whether `value` is equal to one of elements in `query`.
   *
   */
  q$in(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Checks whether `value` is not equal to any elements in `query`.
   *
   */
  q$nin(value: ValueType, query: Query, data?: unknown): boolean;

  /**
   * Sets the value.
   *
   */
  u$set(value: ValueType, update: T, _data?: unknown): T;

  /**
   * Unsets the value.
   *
   */
  u$unset(value: ValueType, update: T, _data?: unknown): T;

  /**
   * Renames a field.
   *
   */
  u$rename(value: ValueType, update: T, _data?: unknown): T;
}
