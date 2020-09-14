import SchemaType from '../schematype';
import type { ValueType } from './';
import { setGetter } from '../util';

type PropGetter = (this: ValueType) => ValueType;
type PropSetter = (this: unknown, value: ValueType) => void;

/**
 * Virtual schema type.
 */
export default class SchemaTypeVirtual extends SchemaType {

  private getter: PropGetter = () => null;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private setter: PropSetter = () => { };

  /**
   * Add a getter.
   *
   */
  get(fn: PropGetter): this {
    if (typeof fn !== 'function') {
      throw new TypeError('Getter must be a function!');
    }

    this.getter = fn;

    return this;
  }

  /**
   * Add a setter.
   *
   */
  set(fn: PropSetter): this {
    if (typeof fn !== 'function') {
      throw new TypeError('Setter must be a function!');
    }

    this.setter = fn;

    return this;
  }

  /**
   * Applies getters.
   *
   */
  cast(value: ValueType, data: Any): undefined {
    if (typeof this.getter !== 'function') return;

    const getter = this.getter;
    let hasCache = false;
    let cache: ValueType;

    setGetter(data, this.name, () => {
      if (!hasCache) {
        cache = getter.call(data);
        hasCache = true;
      }

      return cache;
    });
  }

  /**
   * Applies setters.
   *
   */
  validate(value: ValueType, data: unknown): undefined {
    if (typeof this.setter === 'function') {
      this.setter.call(data, value);
    }
    return undefined;
  }
}
