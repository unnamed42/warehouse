import SchemaType from '../schematype';
import type { ValueType } from './';
import ValidationError from '../error/validation';

/**
 * Boolean schema type.
 */
export default class SchemaTypeBoolean extends SchemaType<boolean> {

  /**
   * Casts a boolean.
   *
   */
  cast(value_: ValueType | null, _data?: unknown): boolean {
    const value = super.cast(value_, _data);

    if (value === 'false' || value === '0') return false;

    return Boolean(value);
  }

  /**
   * Validates a boolean.
   *
   */
  validate(value_: ValueType | null, _data: unknown): boolean | null {
    const value = super.validate(value_, _data);

    if (value != null && typeof value !== 'boolean') {
      throw new ValidationError(`\`${value}\` is not a boolean!`);
    }

    return value;
  }

  /**
   * Parses data and transform them into boolean values.
   *
   */
  parse(value: ValueType, _data?: unknown): boolean {
    return Boolean(value);
  }

  /**
   * Transforms data into number to compress the size of database files.
   *
   */
  value(value: boolean, _data?: unknown): number {
    return +value;
  }
}
