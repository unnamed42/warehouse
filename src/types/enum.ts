import SchemaType, { SchemaOptions } from '../schematype';
import ValidationError from '../error/validation';
import type { ValueType } from './';

/**
 * Enum schema type.
 */
export default class SchemaTypeEnum extends SchemaType {

  constructor(name: string, options: SchemaOptions) {
    super(name, Object.assign({
      elements: []
    }, options));
  }

  /**
   * Validates data. The value must be one of elements set in the options.
   *
   */
  validate(value_: ValueType, data?: unknown): ValueType {
    const value = super.validate(value_, data);
    const elements = this.options.elements!;

    if (value == null || !elements.includes(value)) {
      throw new ValidationError(`The value must be one of ${elements.join(', ')}`);
    }

    return value;
  }
}
