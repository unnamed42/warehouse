import SchemaType from '@/schematype';
import { getProp, setProp } from '@/util';
import { isPlainObject as _plainObj } from 'is-plain-object';

import type Document from '@/document';
import type { QueryCallback } from './types';
import type { ValueType } from '@/types';

const isPlainObject = <T extends Any>(obj: Recursive<T>): obj is T =>
  _plainObj(obj);

type UpdateFn =
  (value: Document, query: ValueType, data: Any) => boolean;

type StackFn =
  (data: Document) => void;

/**
 * @typedef PopulateResult
 * @property {string} path
 * @property {*} model
 */
export type PopulateResult<TModel> =
  (path: string) => TModel;

export class UpdateParser {
  static updateStackNormal(key: string, update: Any): StackFn {
    return data => { setProp(data, key, update); };
  }

  static updateStackOperator(path_: string | null, ukey: string, key: string, update: Any): StackFn {
    const path = (path_ || new SchemaType(key)) as unknown as Dict<UpdateFn>;

    return data => {
      const result = path[ukey](getProp(data, key), update, data);
      setProp(data, key, result);
    };
  }

  constructor(private paths: Dict<SchemaType>) {}

  /**
   * Parses updating expressions and returns a stack.
   *
   * @param {Object} updates
   * @param {queryCallback[]} [stack]
   * @private
   */
  parseUpdate(updates: Any, prefix = '', stack: QueryCallback[] = []): QueryCallback[] {
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
