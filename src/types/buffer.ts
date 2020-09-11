import SchemaType, { SchemaOptions } from '../schematype';
import ValidationError from '../error/validation';
import type { ValueType } from './';

/**
 * Boolean schema type.
 */
export default class SchemaTypeBuffer extends SchemaType {

  constructor(name: string, options: SchemaOptions) {
    super(name, Object.assign({
      encoding: 'hex'
    }, options));
  }

  /**
   * Casts data.
   *
   */
  cast(value_: ValueType | null, data?: unknown): Buffer | null {
    const value = super.cast(value_, data);

    if (value == null) return null;
    if (Buffer.isBuffer(value)) return value;
    if (typeof value === 'string') return Buffer.from(value, this.options.encoding);
    if (Array.isArray(value)) return Buffer.from(value);

    throw new ValidationError(`\`${value}\` cannot be interpreted as Buffer`);
  }

  /**
   * Validates data.
   *
   */
  validate(value_: ValueType, data?: unknown): Buffer {
    const value = super.validate(value_, data);

    if (!Buffer.isBuffer(value)) {
      throw new ValidationError(`\`${value}\` is not a valid buffer!`);
    }

    return value;
  }

  /**
   * Compares between two buffers.
   *
   */
  compare(a: Buffer, b: Buffer): number {
    if (Buffer.isBuffer(a)) {
      return Buffer.isBuffer(b) ? a.compare(b) : 1;
    }

    return Buffer.isBuffer(b) ? -1 : 0;
  }

  /**
   * Parses data and transform them into buffer values.
   *
   */
  parse(value: ValueType, _data?: unknown): ValueType {
    return value ? Buffer.from(value as string, this.options.encoding) : value;
  }

  /**
   * Transforms data into number to compress the size of database files.
   *
   */
  value(value: ValueType, _data?: unknown): string | null {
    return Buffer.isBuffer(value) ? value.toString(this.options.encoding) : value as string | null;
  }

  /**
   * Checks the equality of data.
   *
   */
  match(value: Buffer, query: Buffer, _data?: unknown): boolean {
    if (Buffer.isBuffer(value) && Buffer.isBuffer(query)) {
      return value.equals(query);
    }

    return value === query;
  }
}
