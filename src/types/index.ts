// prefix underscore to avoid name collisions
import { default as _Mixed } from '../schematype';
import { default as _String } from './string';
import { default as _Number } from './number';
import { default as _Boolean } from './boolean';
import { default as _Array } from './array';
import { default as _Object } from './object';
import { default as _Date } from './date';
import { default as _Virtual } from './virtual';
import { default as _CUID } from './cuid';
import { default as _Enum } from './enum';
import { default as _Integer } from './integer';
import { default as _Buffer } from './buffer';

const types = {
  Mixed: _Mixed,
  String: _String,
  Number: _Number,
  Boolean: _Boolean,
  Array: _Array,
  Object: _Object,
  Date: _Date,
  Virtual: _Virtual,
  CUID: _CUID,
  Enum: _Enum,
  Integer: _Integer,
  Buffer: _Buffer
} as const;

// workaround to fetch constructor by string name
type ExportedTypes = typeof types & Record<string, typeof _Mixed>;
export const Types = types as ExportedTypes;

export type ValueType =
  number | string | boolean | Date | Buffer | Any | null |
  ValueType[];
