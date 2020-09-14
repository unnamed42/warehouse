import SchemaType, {SchemaOptions} from '@/schematype';
import { Types, ValueType } from '@/types';
import Bluebird from 'bluebird';
import { getProp, setProp, delProp } from '@/util';
import PopulationError from '@/error/population';
import { isPlainObject as _plainObj } from 'is-plain-object';
import { QueryCallback } from './queryparser';

const isPlainObject = <T extends Any>(obj: Recursive<T>): obj is T =>
  _plainObj(obj);

/**
 * @typedef PopulateResult
 * @property {string} path
 * @property {*} model
 */
export type PopulateResult<TModel> =
  (path: string) => TModel;

export class UpdateParser {
  static updateStackNormal(key, update) {
    return data => { setProp(data, key, update); };
  }

  static updateStackOperator(path_, ukey, key, update) {
    const path = path_ || new SchemaType(key);

    return data => {
      const result = path[ukey](getProp(data, key), update, data);
      setProp(data, key, result);
    };
  }

  constructor(private paths: Record<string, unknown>) {}

  /**
   * Parses updating expressions and returns a stack.
   *
   * @param {Object} updates
   * @param {queryCallback[]} [stack]
   * @private
   */
  private parseUpdate(updates: Any, prefix = '', stack: QueryCallback<ValueType>[] = []) {
    const { paths } = this;
    const { updateStackOperator } = UpdateParser;
    const keys = Object.keys(updates);
    let path, prefixNoDot;

    if (prefix) {
      prefixNoDot = prefix.substring(0, prefix.length - 1);
      path = paths[prefixNoDot];
    }

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const update = updates[key];
      const name = prefix + key;

      // Update operators
      if (key[0] === '$') {
        const ukey = `u${key}`;

        // First-class update operators
        if (prefix) {
          stack.push(updateStackOperator(path, ukey, prefixNoDot, update));
        } else { // Inline update operators
          const fields = Object.keys(update);
          const fieldLen = fields.length;

          for (let j = 0; j < fieldLen; j++) {
            const field = fields[i];
            stack.push(updateStackOperator(paths[field], ukey, field, update[field]));
          }
        }
      } else if (isPlainObject(update)) {
        this.parseUpdate(update, `${name}.`, stack);
      } else {
        stack.push(UpdateParser.updateStackNormal(name, update));
      }
    }

    return stack;
  }
}