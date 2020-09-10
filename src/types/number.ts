import SchemaType from '../schematype';
import type { ValueType } from './';
import ValidationError from '../error/validation';

/**
 * Number schema type.
 */
export default class SchemaTypeNumber extends SchemaType<number> {

  /**
   * Casts a number.
   *
   */
  cast(value_: ValueType | null, data?: unknown): number | null {
    const value = super.cast(value_, data);

    if (value == null || typeof value === 'number') return value;

    return +value;
  }

  /**
   * Validates a number.
   *
   */
  validate(value_: ValueType, data?: unknown): number {
    const value = super.validate(value_, data);

    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
      throw new ValidationError(`\`${value}\` is not a number!`);
    }

    return value;
  }

  /**
   * Adds value to a number.
   *
   */
  u$inc(value: number, update: number, _data?: unknown): number {
    return value ? value + update : update;
  }

  /**
   * Subtracts value from a number.
   *
   */
  u$dec(value: number, update: number, _data?: unknown): number {
    return value ? value - update : -update;
  }

  /**
   * Multiplies value to a number.
   *
   */
  u$mul(value: number, update: number, _data?: unknown): number {
    return value ? value * update : 0;
  }

  /**
   * Divides a number by a value.
   *
   */
  u$div(value: number, update: number, _data?: unknown): number {
    return value ? value / update : 0;
  }

  /**
   * Divides a number by a value and returns the remainder.
   *
   */
  u$mod(value: number, update: number, _data?: unknown): number {
    return value ? value % update : 0;
  }

  /**
   * Updates a number if the value is greater than the current value.
   *
   */
  u$max(value: number, update: number, _data?: unknown): number {
    return update > value ? update : value;
  }

  /**
   * Updates a number if the value is less than the current value.
   *
   */
  u$min(value: number, update: number, _data?: unknown): number {
    return update < value ? update : value;
  }
}
