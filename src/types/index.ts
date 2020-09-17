// prefix underscore to avoid name collisions
import SchemaType from '../schematype';
import SchemaTypeString from './string';
import SchemaTypeNumber from './number';
import SchemaTypeBoolean from './boolean';
import SchemaTypeArray from './array';
import SchemaTypeObject from './object';
import SchemaTypeDate from './date';
import SchemaTypeVirtual from './virtual';
import SchemaTypeCUID from './cuid';
import SchemaTypeEnum from './enum';
import SchemaTypeInteger from './integer';
import SchemaTypeBuffer from './buffer';

const types = {
  Mixed: SchemaType,
  String: SchemaTypeString,
  Number: SchemaTypeNumber,
  Boolean: SchemaTypeBoolean,
  Array: SchemaTypeArray,
  Object: SchemaTypeObject,
  Date: SchemaTypeDate,
  Virtual: SchemaTypeVirtual,
  CUID: SchemaTypeCUID,
  Enum: SchemaTypeEnum,
  Integer: SchemaTypeInteger,
  Buffer: SchemaTypeBuffer
} as const;

// workaround to fetch constructor by string name
type ExportedTypes = typeof types & Dict<typeof SchemaType>;
export const Types = types as ExportedTypes;

export type SchemaInstance<T extends SchemaType> =
  T extends SchemaTypeString | SchemaTypeCUID ? string :
  T extends SchemaTypeInteger | SchemaTypeNumber ? number :
  T extends SchemaTypeBoolean ? boolean :
  T extends SchemaTypeDate ? Date :
  T extends SchemaTypeBuffer ? Buffer :
  T extends SchemaTypeArray ? ValueType[] :
  T extends SchemaTypeObject ? ValueObject :
    ValueType;

export type LeafValueTypes =
  number | string | boolean | Date | Buffer | null;

export type ValueType = Recursive<LeafValueTypes, true>;

export type ValueObject = RecursiveObject<LeafValueTypes, true>;
