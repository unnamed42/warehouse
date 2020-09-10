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

export function getProp<
  T extends Any,
  TKey extends keyof T
>(obj: T, key: TKey): T[TKey];

export function getProp<T extends Any>(obj: T, key: string): unknown {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  if (!key.includes('.')) {
    return obj[key];
  }

  const token = extractPropKey(key);
  let result = obj;
  const len = token.length;

  for (let i = 0; i < len; i++) {
    result = result[token[i]] as T;
  }

  return result;
}

export function setProp<
  T extends Any,
  TKey extends keyof T,
  TValue extends T[TKey]
>(obj: T, key: TKey, value: TValue): void;

export function setProp<T extends Any>(obj: T, key: string, value: unknown): void {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');

  // typing workaround https://github.com/microsoft/TypeScript/issues/31661
  const typedObj = obj as Any;

  if (!key.includes('.')) {
    typedObj[key] = 'value';
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop()!;
  const len = token.length;

  let cursor: Any = typedObj;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor[name] = cursor[name] || {};
    cursor = cursor[name] as T;
  }

  cursor[lastKey] = value;
}

export function delProp<
  T extends Any,
  TKey extends keyof T
>(obj: T, key: TKey): Omit<T, TKey>;

export function delProp<T extends Any>(obj: T, key: string): unknown {
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
      cursor = cursor[name] as T;
    } else {
      return;
    }
  }

  delete cursor[lastKey];
}

export function setGetter<
  T extends Any,
  TKey extends keyof T
>(obj: T, key: TKey, fn: (this: T) => T[TKey]): void;

export function setGetter<T extends Any>(
  obj: T,
  key: string,
  fn: (this: T) => unknown
): void {
  if (typeof obj !== 'object') throw new TypeError('obj must be an object!');
  if (!key) throw new TypeError('key is required!');
  // if (typeof fn !== 'function') throw new TypeError('fn must be a function!');

  if (!key.includes('.')) {
    Object.defineProperty(obj, key, fn);
    return;
  }

  const token = extractPropKey(key);
  const lastKey = token.pop()!;
  const len = token.length;

  let cursor = obj as Any;

  for (let i = 0; i < len; i++) {
    const name = token[i];
    cursor[name] = (cursor[name] || {}) as T;
    cursor = cursor[name] as T;
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

export const reverse = <T>(arr: T[]): T[] =>
  arr.reverse();
// exports.reverse = arr => {
//   if (!Array.isArray(arr)) throw new TypeError('arr must be an array!');

//   const len = arr.length;

//   if (!len) return arr;

//   for (let left = 0, right = len - 1; left < right; left++, right--) {
//     const tmp = arr[left];
//     arr[left] = arr[right];
//     arr[right] = tmp;
//   }

//   return arr;
// };

type ParseArgsType<T> = T extends string ? Record<string, 1 | 0 | -1> : Exclude<T, string>;

function _parseArgs<T>(args: T): ParseArgsType<T> {
  if (typeof args !== 'string') return args as ParseArgsType<T>;

  const arr = args.split(' ');
  const result = {} as Record<string, 1 | 0 | -1>;

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

  return result as ParseArgsType<T>;
}

// TODO: better type for `orderBy`
export function parseArgs(orderBy: string | any, order: string | number): unknown {
  let result;

  if (order) {
    result = { [orderBy]: order };
  } else if (typeof orderBy === 'string') {
    result = _parseArgs(orderBy);
  } else {
    result = orderBy as unknown;
  }

  return result;
}
