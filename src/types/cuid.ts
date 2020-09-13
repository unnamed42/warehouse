import SchemaType from '../schematype';
import cuid from 'cuid';
import ValidationError from '../error/validation';

/**
 * [CUID](https://github.com/ericelliott/cuid) schema type.
 */
export default class SchemaTypeCUID extends SchemaType {

  /**
   * Casts data. Returns a new CUID only if value is null and the field is
   * required.
   *
   */
  cast(value: string | null, _data?: unknown): string | null {
    if (value == null && this.options.required) {
      return cuid();
    }

    return value;
  }

  /**
   * Validates data. A valid CUID must be started with `c` and 25 in length.
   *
   */
  validate(value: string | null, _data?: unknown): string | null {
    if (value && (value[0] !== 'c' || value.length !== 25)) {
      throw new ValidationError(`\`${value}\` is not a valid CUID`);
    }

    return value;
  }
}
