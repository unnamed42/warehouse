import SchemaType from '../schematype';
import ValidationError from '../error/validation';
import type { ValueType } from './';

/**
 * Date schema type.
 */
export default class SchemaTypeDate extends SchemaType {

  /**
   * Casts data.
   *
   */
  cast(value_: ValueType, data?: unknown): Date | null {
    const value = super.cast(value_, data);

    if (value == null) return null;
    if (value instanceof Date) return value;

    // workaround signature of `Date` constructor
    return new Date(value as string);
  }

  /**
   * Validates data.
   *
   */
  validate(value_: ValueType, data?: unknown): Date | null {
    const value = super.validate(value_, data);

    if (value != null && (!(value instanceof Date) || isNaN(value.getTime()))) {
      throw new ValidationError(`\`${value}\` is not a valid date!`);
    }

    return value;
  }

  /**
   * Checks the equality of data.
   *
   */
  match(value: Date, query: Date, _data?: unknown): boolean {
    if (!value || !query) {
      return value === query;
    }

    return value.getTime() === query.getTime();
  }

  /**
   * Compares between two dates.
   *
   */
  compare(a: Date, b: Date): number {
    if (a) {
      return b ? a.valueOf() - b.valueOf() : 1;
    }

    return b ? -1 : 0;
  }

  /**
   * Parses data and transforms it into a date object.
   *
   */
  parse(value: ValueType, _data?: unknown): Date {
    if (value) return new Date(value as string);
    // TODO: `undefined` allowed here?
    throw new ValidationError(`\`${value}\` cannot be interpreted as Date`);
  }

  /**
   * Transforms a date object to a string.
   *
   */
  value(value: Date, _data?: unknown): string {
    return value ? value.toISOString() : value;
  }

  /**
   * Finds data by its date.
   *
   */
  q$day(value: Date | null, query: number, _data?: unknown): boolean {
    return value ? value.getDate() === query : false;
  }

  /**
   * Finds data by its month. (Start from 0)
   *
   */
  q$month(value: Date | null, query: number, _data?: unknown): boolean {
    return value ? value.getMonth() === query : false;
  }

  /**
   * Finds data by its year. (4-digit)
   *
   */
  q$year(value: Date | null, query: number, _data?: unknown): boolean {
    return value ? value.getFullYear() === query : false;
  }

  /**
   * Adds milliseconds to date.
   *
   */
  u$inc(value: Date | null, update: number, _data?: unknown): Date | undefined {
    if (value) return new Date(value.getTime() + update);
  }

  /**
   * Subtracts milliseconds from date.
   *
   */
  u$dec(value: Date | null, update: number, _data?: unknown): Date | undefined {
    if (value) return new Date(value.getTime() - update);
  }
}
