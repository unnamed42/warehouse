import type { SortOrderSpec, SortSpec } from '@/query';
import type { ValueObject, ValueType } from './types';

export const shuffle = <T>(array: T[]): T[] => {
  if (!Array.isArray(array)) throw new TypeError('array must be an Array!');
  const $array = array.slice();
  const { length } = $array;
  const { random, floor } = Math;

  for (let i = 0; i < length; i++) {
    // @see https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L6718
    // @see https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L3884
    const rand = i + floor(random() * (length - i));

    const temp = $array[i];
    $array[i] = $array[rand];
    $array[rand] = temp;
  }

  return $array;
};

const extractPropKey = (key: string) =>
  key.split('.');

export const getProp = (obj: ValueObject, key: string): ValueType => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    return obj[key];
  }

  const token = extractPropKey(key);
  let result = obj;
  const len = token.length;

  for (let i = 0; i < len; i++) {
    result = result[token[i]] as ValueObject;
  }

  return result;
};

export const setProp = (obj: ValueObject, key: string, value: ValueType): void => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    obj[key] = 'value';
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop()!;
  const len = token.length;

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor[name] = cursor[name] || {};
    cursor = cursor[name] as ValueObject;
  }

  cursor[lastKey] = value;
};

export const delProp = (obj: ValueObject, key: string): void => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    delete obj[key];
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop()!;
  const len = token.length;

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];

    if (cursor[name]) {
      cursor = cursor[name] as ValueObject;
    } else {
      return;
    }
  }

  delete cursor[lastKey];
};

export const setGetter = (
  obj: ValueObject,
  key: string,
  fn: (this: ValueObject) => ValueType
): void => {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');
  if (typeof fn !== 'function') throw new TypeError('fn must be a function!');

  if (!key.includes('.')) {
    Object.defineProperty(obj, key, fn);
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop()!;
  const len = token.length;

  let cursor = obj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor[name] = cursor[name] || {};
    cursor = cursor[name] as ValueObject;
  }

  Object.defineProperty(cursor, lastKey, fn);
};

export const arr2obj = <T extends string | number | symbol, TValue>(arr: T[], value: TValue): Record<T, TValue> => {
  // if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  const obj = {} as Record<T, TValue>;
  let i = arr.length;

  while (i--) {
    obj[arr[i]] = value;
  }

  return obj;
};

export const reverse = <T>(arr: T[]): T[] => {
  if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

  const len = arr.length;

  if (!len) return arr;

  for (let left = 0, right = len - 1; left < right; left++, right--) {
    const tmp = arr[left];
    arr[left] = arr[right];
    arr[right] = tmp;
  }

  return arr;
};

const _parseArgs = (args: string | Dict<SortOrderSpec>): Dict<SortSpec> => {
  if (typeof args !== 'string') return args;

  const arr = args.split(' ');
  const result: Dict<1 | -1> = {};

  for (let i = 0, len = arr.length; i < len; i++) {
    const key = arr[i];

    switch (key[0]) {
      case '+':
        result[key.slice(1)] = 1;
        break;

      case '-':
        result[key.slice(1)] = -1;
        break;

      default:
        result[key] = 1;
    }
  }

  return result;
};

export const parseArgs = (orderBy: string | Dict<SortSpec>, order?: SortOrderSpec): Dict<SortSpec> => {
  let result: Dict<SortSpec>;

  if (order) {
    result = { [orderBy as string]: order };
  } else if (typeof orderBy === 'string') {
    result = _parseArgs(orderBy);
  } else {
    result = orderBy;
  }

  return result;
};
