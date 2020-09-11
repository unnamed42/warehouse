import { default as Mixed } from '../schematype';
import { default as String } from './string';
import { default as Number } from './number';
import { default as Boolean } from './boolean';
import { default as Array } from './array';
import { default as Object } from './object';
import { default as Date } from './date';
import { default as Virtual } from './virtual';
import { default as CUID } from './cuid';
import { default as Enum } from './enum';
import { default as Integer } from './integer';
import { default as Buffer } from './buffer';

const types = {
  Mixed,
  String,
  Number,
  Boolean,
  Array,
  Object,
  Date,
  Virtual,
  CUID,
  Enum,
  Integer,
  Buffer
} as const;

// workaround to fetch constructor by string name
type ExportedTypes = typeof types & Record<string, typeof Mixed>;
export const Types = types as ExportedTypes;

export type ValueType =
  number | string | boolean | Date | Buffer | Any | null |
  ValueType[];
