import SchemaType from '../schematype';
import { ValueType, ValueObject } from '../types';
import { isPlainObject } from 'is-plain-object';
import { getProp } from '../util';

import type { QueryFilterCallback } from './types';

export class QueryParser<Query extends ValueType = ValueType> {
  constructor(private paths: Dict<SchemaType>) {}

  /**
   *
   * @param {string} name
   * @param {*} query
   * @return {queryFilterCallback}
   */
  queryStackNormal(name: string, query: Query): QueryFilterCallback<ValueObject> {
    const path = this.paths[name] || new SchemaType(name);

    return data => path.match(getProp(data, name), query, data);
  }

  /**
   *
   * @param {string} qkey
   * @param {string} name
   * @param {*} query
   * @return {queryFilterCallback}
   */
  queryStackOperator(qkey: keyof SchemaType, name: string, query: Query): QueryFilterCallback<ValueType> {
    const path = this.paths[name] || new SchemaType(name);

    return data => path[qkey](getProp(data, name), query, data);
  }

  /**
   * @param {Array} arr
   * @param stack The function generated by query is added to the stack.
   *
   */
  $and(arr: Query[], stack: QueryFilterCallback<ValueType>[]): void {
    for (let i = 0, len = arr.length; i < len; i++) {
      stack.push(this.execQuery(arr[i]));
    }
  }

  /**
   *
   */
  private $or(query: Query[]): QueryFilterCallback<ValueType> {
    const stack = this.parseQueryArray(query);
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (stack[i](data)) return true;
      }

      return false;
    };
  }

  /**
   *
   */
  private $nor(query: Query[]): QueryFilterCallback<ValueType> {
    const stack = this.parseQueryArray(query);
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (stack[i](data)) return false;
      }

      return true;
    };
  }

  /**
   *
   */
  private $not(query: Recursive<Query>): QueryFilterCallback<ValueType> {
    const stack = this.parseQuery(query);
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (!stack[i](data)) return true;
      }

      return false;
    };
  }

  /**
   *
   */
  $where(fn: (this: QueryParser<Query>) => boolean): QueryFilterCallback<ValueType> {
    return data => Reflect.apply(fn, data, []) as boolean;
  }

  /**
   * Parses array of query expressions and returns a stack.
   *
   */
  private parseQueryArray(arr: Query[]): QueryFilterCallback<ValueType>[] {
    const stack: QueryFilterCallback<ValueType>[] = [];
    this.$and(arr, stack);
    return stack;
  }

  /**
   * Parses normal query expressions and returns a stack.
   *
   * @param queries
   * @param prefix
   * @param [stack] The function generated by query is added to the stack passed in this argument. If not passed, a new stack will be created.
   */
  private parseNormalQuery(queries: Recursive<Query>, prefix: string, stack: QueryFilterCallback<ValueType>[] = []): void {
    const keys = Object.keys(queries);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const query = queries[key];

      if (key[0] === '$') {
        stack.push(this.queryStackOperator(`q${key}`, prefix, query));
        continue;
      }

      const name = `${prefix}.${key}`;
      if (isPlainObject<Query>(query)) {
        this.parseNormalQuery(query, name, stack);
      } else {
        stack.push(this.queryStackNormal(name, query));
      }
    }
  }

  /**
   * Parses query expressions and returns a stack.
   *
   */
  private parseQuery(queries: Recursive<Query>): QueryFilterCallback<ValueType>[] {

    const stack = [] as QueryFilterCallback<ValueType>[];
    const keys = Object.keys(queries);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const query = queries[key];

      switch (key) {
        case '$and':
          this.$and(query, stack);
          break;

        case '$or':
          stack.push(this.$or(query));
          break;

        case '$nor':
          stack.push(this.$nor(query));
          break;

        case '$not':
          stack.push(this.$not(query));
          break;

        case '$where':
          stack.push(this.$where(query));
          break;

        default:
          if (isPlainObject<Query>(query)) {
            this.parseNormalQuery(query, key, stack);
          } else {
            stack.push(this.queryStackNormal(key, query));
          }
      }
    }

    return stack;
  }

  /**
   * Returns a function for querying.
   *
   */
  private execQuery(query: Query): QueryFilterCallback<ValueType> {
    const stack = this.parseQuery(query as unknown as Record<string, Query>);
    const len = stack.length;

    return data => {
      for (let i = 0; i < len; i++) {
        if (!stack[i](data)) return false;
      }

      return true;
    };
  }
}