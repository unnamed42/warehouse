import SchemaType, { QueryType } from '../schematype';
import type { ValueType } from './';
import ValidationError from '../error/validation';

const isRegexp = (expr: QueryType): expr is RegExp =>
  typeof(expr as RegExp).test === 'function';

/**
 * String schema type.
 */
export default class SchemaTypeString extends SchemaType {

  /**
   * Casts a string.
   *
   */
  cast(value_: ValueType | null, data?: unknown): string | null | undefined {
    const value = super.cast(value_, data);

    if (value == null || typeof value === 'string') return value;
    if (typeof value.toString === 'function') return value.toString();
  }

  /**
   * Validates a string.
   */
  validate(value_: ValueType, data?: unknown): string | null | undefined {
    const value = super.validate(value_, data);

    if (value !== undefined && typeof value !== 'string') {
      throw new ValidationError(`\`${value}\` is not a string!`);
    }

    return value;
  }

  /**
   * Checks the equality of data.
   *
   */
  match(value: ValueType, query: ValueType, _?: unknown): boolean;
  match(value: string | null, query: RegExp, _?:unknown): boolean;
  match(value: ValueType, query: QueryType, _data?: unknown): boolean;

  match(value: ValueType, query: QueryType, _data?: unknown): boolean {
    if (!value || !query) {
      return value === query;
    }

    if (isRegexp(query)) {
      // `Regex.test` returns false for non-string types
      return query.test(value as string);
    }

    return value === query;
  }

  /**
   * Checks whether a string is equal to one of elements in `query`.
   *
   */
  q$in(value: string | null, query: QueryType[], data?: unknown): boolean {
    for (let i = 0, len = query.length; i < len; i++) {
      if (this.match(value, query[i], data)) return true;
    }

    return false;
  }

  /**
   * Checks whether a string is not equal to any elements in `query`.
   *
   */
  q$nin(value: string | null, query: QueryType[], data?: unknown): boolean {
    return !this.q$in(value, query, data);
  }

  /**
   * Checks length of a string.
   *
   */
  q$length(value: string | null, query: number, _data?: unknown): boolean {
    return (value ? value.length : 0) === query;
  }
}
