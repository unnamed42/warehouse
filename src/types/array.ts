import SchemaType, { SchemaOptions } from '../schematype';
import {ValueType} from './';
import ValidationError from '../error/validation';

const { isArray } = Array;

/**
 * Array schema type.
 */
export default class SchemaTypeArray extends SchemaType {

  private readonly child: SchemaType;

  constructor(name: string, options?: SchemaOptions) {
    super(name, Object.assign({
      default: []
    }, options));

    this.child = this.options.child || new SchemaType(name);
  }

  /**
   * Casts an array and its child elements.
   *
   */
  cast(value_: ValueType, data: Any): ValueType[] | null {
    let value = super.cast(value_, data);
    if (value == null) return null;

    if (!isArray(value)) value = [value];
    if (!value.length) return value;

    const child = this.child;

    for (let i = 0, len = value.length; i < len; i++) {
      // TODO: `undefined` handling
      value[i] = child.cast(value[i], data)!;
    }

    return value;
  }

  /**
   * Validates an array and its child elements.
   *
   */
  validate(value_: ValueType | null, data?: unknown): ValueType[] {
    const value = super.validate(value_, data);

    if (!isArray(value)) {
      throw new ValidationError(`\`${value}\` is not an array!`);
    }

    if (!value.length) return value;

    const child = this.child;

    for (let i = 0, len = value.length; i < len; i++) {
      // TODO: investigate `undefined`-ness
      value[i] = child.validate(value[i], data)!;
    }

    return value;
  }

  /**
   * Compares an array by its child elements and the size of the array.
   *
   */
  compare(a: ValueType[], b: ValueType[]): number {
    if (a) {
      if (!b) return 1;
    } else {
      return b ? -1 : 0;
    }

    const lenA = a.length;
    const lenB = b.length;
    const child = this.child;

    for (let i = 0, len = Math.min(lenA, lenB); i < len; i++) {
      const result = child.compare(a[i], b[i]);
      if (result !== 0) return result;
    }

    // Compare by length
    return lenA - lenB;
  }

  /**
   * Parses data.
   *
   */
  parse(value: ValueType[], data?: unknown): ValueType[] {
    if (!value) return value;

    const len = value.length;
    if (!len) return [];

    const result = new Array<ValueType>(len);
    const child = this.child;

    for (let i = 0; i < len; i++) {
      result[i] = child.parse(value[i], data);
    }

    return result;
  }

  /**
   * Transforms data.
   *
   */
  value(value: ValueType[], data?: unknown): ValueType[] {
    if (!value) return value;

    const len = value.length;
    if (!len) return [];

    const result = new Array<ValueType>(len);
    const child = this.child;

    for (let i = 0; i < len; i++) {
      result[i] = child.value(value[i], data);
    }

    return result;
  }

  /**
   * Checks the equality of an array.
   *
   */
  match(value: ValueType[], query: ValueType[], data?: unknown): boolean {
    if (!value || !query) {
      return value === query;
    }

    const lenA = value.length;
    const lenB = query.length;

    if (lenA !== lenB) return false;

    const child = this.child;

    for (let i = 0; i < lenA; i++) {
      if (!child.match(value[i], query[i], data)) return false;
    }

    return true;
  }

  /**
   * Checks whether the number of elements in an array is equal to `query`.
   *
   */
  q$size(value: ValueType[], query: number, _data?: unknown): boolean {
    return (value ? value.length : 0) === query;
  }

  q$length(value: ValueType[], query: number, _data?: unknown): boolean {
    return this.q$size(value, query, _data);
  }

  /**
   * Checks whether an array contains one of elements in `query`.
   *
   */
  q$in(value: ValueType[], query: ValueType[], _data?: unknown): boolean {
    if (!value) return false;

    for (let i = 0, len = query.length; i < len; i++) {
      if (value.includes(query[i])) return true;
    }

    return false;
  }

  /**
   * Checks whether an array does not contain in any elements in `query`.
   *
   */
  q$nin(value: ValueType[], query: ValueType[], _data?: unknown): boolean {
    if (!value) return true;

    for (let i = 0, len = query.length; i < len; i++) {
      if (value.includes(query[i])) return false;
    }

    return true;
  }

  /**
   * Checks whether an array contains all elements in `query`.
   *
   */
  q$all(value: ValueType[], query: ValueType[], _data?: unknown): boolean {
    if (!value) return false;

    for (let i = 0, len = query.length; i < len; i++) {
      if (!value.includes(query[i])) return false;
    }

    return true;
  }

  /**
   * Add elements to an array.
   *
   */
  u$push(value: ValueType[], update: ValueType, _data?: unknown): ValueType[] {
    if (isArray(update)) {
      return value ? value.concat(update) : update;
    }

    if (value) {
      value.push(update);
      return value;
    }

    return [update];
  }

  u$append(value: ValueType[], update: ValueType, _data?: unknown): ValueType[] {
    return this.u$push(value, update, _data);
  }

  /**
   * Add elements in front of an array.
   *
   */
  u$unshift(value: ValueType[], update: ValueType, _data?: unknown): ValueType[] {
    if (isArray(update)) {
      return value ? update.concat(value) : update;
    }

    if (value) {
      value.unshift(update);
      return value;
    }

    return [update];
  }

  u$prepend(value: ValueType[], update: ValueType, _data?: unknown): ValueType[] {
    return this.u$unshift(value, update, _data);
  }

  /**
   * Removes elements from an array.
   *
   */
  u$pull(value: ValueType[], update: ValueType, _data?: unknown): ValueType[] {
    if (!value) return value;

    if (isArray(update)) {
      return value.filter(item => !update.includes(item));
    }

    return value.filter(item => item !== update);
  }

  /**
   * Removes the first element from an array.
   *
   */
  u$shift(value: ValueType[], update: number | boolean, _data?: unknown): ValueType[] {
    if (!value || !update) return value;

    if (update === true) {
      return value.slice(1);
    } else if (update > 0) {
      return value.slice(update);
    }

    return value.slice(0, value.length + update);
  }

  /**
   * Removes the last element from an array.
   *
   */
  u$pop(value: ValueType[], update: number | boolean, _data?: unknown): ValueType[] {
    if (!value || !update) return value;

    const length = value.length;

    if (update === true) {
      return value.slice(0, length - 1);
    } else if (update > 0) {
      return value.slice(0, length - update);
    }

    return value.slice(-update, length);
  }

  /**
   * Add elements to an array only if the value is not already in the array.
   *
   */
  u$addToSet(value: ValueType[], update: ValueType, _data?: unknown): ValueType[] {
    if (isArray(update)) {
      if (!value) return update;

      for (let i = 0, len = update.length; i < len; i++) {
        const item = update[i];
        if (!value.includes(item)) value.push(item);
      }

      return value;
    }

    if (!value) return [update];

    if (!value.includes(update)) {
      value.push(update);
    }

    return value;
  }
}
