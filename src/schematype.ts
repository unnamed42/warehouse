import { setProp } from './util';
import ValidationError from './error/validation';
import type { ValueType, ValueObject } from './types';

export interface SchemaOptions {
  required?: boolean;
  default?: ValueType | (() => ValueType);
  // used in array types
  child?: SchemaType;
  // used in buffer types
  encoding?: BufferEncoding;
  // used in enum types
  elements?: ValueType[];
  // reference
  ref?: string;
}

// QueryType[] for compatibility of `SchemaArray.match`
export type QueryType = ValueType | RegExp | QueryType[];

/**
 * This is the basic schema type.
 * All schema types should inherit from this class.
 * For example:
 *
 * ``` js
 * class SchemaTypeCustom extends SchemaType {};
 * ```
 *
 * **Query operators**
 *
 * To add a query operator, defines a method whose name is started with `q$`.
 * For example:
 *
 * ``` js
 * SchemaTypeCustom.q$foo = function(value, query, data){
 *   // ...
 * };
 * ```
 *
 * The `value` parameter is the value of specified field; the `query` parameter
 * is the value passed to the query operator; the `data` parameter is the
 * complete data.
 *
 * The return value must be a boolean indicating whether the data passed.
 *
 * **Update operators**
 *
 * To add a update operator, defines a method whose name is started with `u$`.
 * For example:
 *
 * ``` js
 * SchemaTypeCustom.u$foo = function(value, update, data){
 *   // ...
 * };
 * ```
 *
 * The `value` parameter is the value of specified field; the `update` parameter
 * is the value passed to the update operator; the `data` parameter is the
 * complete data.
 *
 * The return value will replace the original data.
 */
export default class SchemaType {

  protected name: string;
  protected options: SchemaOptions;
  protected default: () => ValueType | undefined;

  /**
   * SchemaType constructor.
   *
   */
  constructor(name?: string, options?: SchemaOptions) {
    this.name = name || '';

    this.options = Object.assign({
      required: false
    }, options);

    const { default: default_ } = this.options;

    if (typeof default_ === 'function') {
      this.default = default_;
    } else {
      this.default = () => default_;
    }
  }

  /**
   * Casts data. This function is used by getters to cast an object to document
   * instances. If the value is null, the default value will be returned.
   *
   */
  cast(value?: ValueType, _data?: unknown): ValueType | undefined {
    if (value == null) {
      return this.default();
    }

    return value;
  }

  /**
   * Validates data. This function is used by setters.
   *
   */
  validate(value?: ValueType, _data?: unknown): ValueType | undefined {
    if (this.options.required && value == null) {
      throw new ValidationError(`\`${this.name}\` is required!`);
    }

    return value;
  }

  /**
   * Compares data. This function is used when sorting.
   *
   */
  compare(a: ValueType, b: ValueType): number {
    if (a! > b!) {
      return 1;
    } else if (a! < b!) {
      return -1;
    }

    return 0;
  }

  /**
   * Parses data. This function is used when restoring data from database files.
   *
   */
  parse(value: ValueType, _data?: unknown): ValueType {
    return value;
  }

  /**
   * Transforms value. This function is used when saving data to database files.
   *
   */
  value(value: ValueType, _data?: unknown): ValueType {
    return value;
  }

  /**
   * Checks the equality of data.
   *
   */
  match(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return value === query;
  }

  /**
   * Checks the existance of data.
   *
   */
  q$exist(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return (value != null) === query;
  }

  q$exists(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return this.q$exist(value, query, _data);
  }

  /**
   * Checks the equality of data. Returns true if the value doesn't match.
   *
   */
  q$ne(value: ValueType, query: QueryType, data: unknown): boolean {
    return !this.match(value, query, data);
  }

  /**
   * Checks whether `value` is less than (i.e. <) the `query`.
   *
   */
  q$lt(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return value! < query!;
  }

  /**
   * Checks whether `value` is less than or equal to (i.e. <=) the `query`.
   *
   */
  q$lte(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return value! <= query!;
  }

  q$max(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return this.q$lte(value, query, _data);
  }

  /**
   * Checks whether `value` is greater than (i.e. >) the `query`.
   *
   */
  q$gt(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return value! > query!;
  }

  /**
   * Checks whether `value` is greater than or equal to (i.e. >=) the `query`.
   *
   */
  q$gte(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return value! >= query!;
  }

  q$min(value: ValueType, query: QueryType, _data?: unknown): boolean {
    return this.q$gte(value, query, _data);
  }

  /**
   * Checks whether `value` is equal to one of elements in `query`.
   *
   */
  q$in(value: ValueType, query: QueryType[], _data?: unknown): boolean {
    return query.includes(value);
  }

  /**
   * Checks whether `value` is not equal to any elements in `query`.
   *
   */
  q$nin(value: ValueType, query: QueryType[], _data?: unknown): boolean {
    return !query.includes(value);
  }

  /**
   * Sets the value.
   *
   */
  u$set(_value: ValueType, update: ValueType, _data?: unknown): ValueType {
    return update;
  }

  /**
   * Unsets the value.
   *
   */
  u$unset(value: ValueType, update: ValueType, _data?: unknown): ValueType | undefined {
    return update ? undefined : value;
  }

  /**
   * Renames a field.
   *
   */
  u$rename(value: ValueType | undefined, update: ValueType, data: ValueObject): void {
    if (value !== undefined) setProp(data, update as string, value);
    return undefined;
  }
}
