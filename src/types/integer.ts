import type { ValueType } from './';
import SchemaTypeNumber from './number';
import ValidationError from '../error/validation';

/**
 * Integer schema type.
 */
export default class SchemaTypeInteger extends SchemaTypeNumber {

  /**
   * Casts a integer.
   *
   */
  cast(value_: ValueType | null, _data?: unknown): number {
    const value = super.cast(value_, _data);

    return parseInt(value, 10);
  }

  /**
   * Validates an integer.
   *
   */
  validate(value_: ValueType, data?: unknown): number {
    const value = super.validate(value_, data);

    if (value % 1 !== 0) {
      throw new ValidationError(`\`${value}\` is not an integer!`);
    }

    return value;
  }
}
