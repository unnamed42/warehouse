import SchemaType, { SchemaOptions } from '../schematype';
import type { ValueType } from './';
import ValidationError from '../error/validation';

interface BufferOptions extends SchemaOptions<Buffer> {
  encoding?: BufferEncoding;
}

/**
 * Boolean schema type.
 */
export default class SchemaTypeBuffer extends SchemaType<Buffer, BufferOptions> {

  /**
   * @param {string} name
   * @param {object} [options]
   *   @param {boolean} [options.required=false]
   *   @param {boolean|Function} [options.default]
   *   @param {string} [options.encoding=hex]
   */
  constructor(name: string, options: BufferOptions) {
    super(name, Object.assign({
      encoding: 'hex'
    }, options));
  }

  /**
   * Casts data.
   *
   */
  cast(value_: ValueType | null, data?: unknown): Buffer | null | undefined {
    const value = super.cast(value_, data);

    if (value == null || Buffer.isBuffer(value)) return value;
    if (typeof value === 'string') return Buffer.from(value, this.options.encoding);
    if (Array.isArray(value)) return Buffer.from(value);
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
  compare(a: Buffer, b: Buffer): Order {
    if (Buffer.isBuffer(a)) {
      return Buffer.isBuffer(b) ? a.compare(b) as Order : 1;
    }

    return Buffer.isBuffer(b) ? -1 : 0;
  }

  /**
   * Parses data and transform them into buffer values.
   *
   * @param {*} value
   * @param {Object} data
   * @return {Boolean}
   */
  parse(value: ValueType, _data?: unknown): boolean {
    return value ? Buffer.from(value, this.options.encoding) : value;
  }

  /**
   * Transforms data into number to compress the size of database files.
   *
   */
  value(value: Buffer, _data?: unknown): number {
    return Buffer.isBuffer(value) ? value.toString(this.options.encoding) : value;
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
