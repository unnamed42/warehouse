import SchemaType, { SchemaOptions } from '../schematype';

export default class SchemaTypeObject extends SchemaType {
  constructor(name?: string, options?: SchemaOptions) {
    super(name, Object.assign({ default: {} }, options));
  }
}
