import Bluebird from 'bluebird';
import Model from './model';
import Schema from './schema';
import Document from './document';
import { parseArgs, shuffle } from './util';

import type { QueryDefinitionObject } from './schema/types';

type IterateFn<T = Document, TResult = void> =
  (item: T, index: number) => TResult;

type FilterFn<T = Document> =
  IterateFn<T, boolean>;

type ReduceFn<T = Document> =
  (prev: T, item: T, index?: number) => T;

export type SortOrderSpec =
  1 | -1 | 'asc' | 'ascending' | 'desc' | 'descending';

export type SortSpec = RecursiveObject<SortOrderSpec>;

interface FindOneOptions {

  /**
   * Skips the first elements. default = 0
   */
  skip?: number;

  /**
   * Returns a plain JavaScript object. default = false
   */
  lean?: boolean;
}

interface FindOptions extends FindOneOptions {

  /**
   * Limits the number of documents returned. default = 0
   */
  limit?: number;
}

const isNotQuery = (lean: boolean | undefined, obj: Query | Any[]): obj is Any[] =>
  !!lean;

export default class Query {

  public _model!: Model;
  public _schema!: Schema;

  /**
   * Query constructor.
   *
   */
  constructor(
    private readonly data: Document[],
    private readonly length: number = data.length
  ) {}

  /**
   * Returns the number of elements.
   *
   */
  count(): number {
    return this.length;
  }

  size(): number {
    return this.count();
  }

  /**
   * Iterates over all documents.
   *
   */
  forEach(iterator: IterateFn): void {
    const { data, length } = this;

    for (let i = 0; i < length; i++) {
      iterator(data[i], i);
    }
  }

  each(iterator: IterateFn): void {
    this.forEach(iterator);
  }

  /**
   * Returns an array containing all documents.
   *
   */
  toArray(): Document[] {
    return this.data;
  }

  /**
   * Returns the document at the specified index. `num` can be a positive or
   * negative number.
   *
   */
  eq(i: number): Document {
    const index = i < 0 ? this.length + i : i;
    return this.data[index];
  }

  /**
   * Returns the first document.
   *
   */
  first(): Document {
    return this.eq(0);
  }

  /**
   * Returns the last document.
   *
   */
  last(): Document {
    return this.eq(-1);
  }

  /**
   * Returns the specified range of documents.
   *
   */
  slice(start?: number, end?: number): Query {
    return new Query(this.data.slice(start, end));
  }

  /**
   * Limits the number of documents returned.
   *
   */
  limit(i: number): Query {
    return this.slice(0, i);
  }

  /**
   * Specifies the number of items to skip.
   *
   */
  skip(i: number): Query {
    return this.slice(i);
  }

  /**
   * Returns documents in a reversed order.
   *
   */
  reverse(): Query {
    return new Query(this.data.slice().reverse());
  }

  /**
   * Returns documents in random order.
   *
   */
  shuffle(): Query {
    return new Query(shuffle(this.data));
  }

  random(): Query {
    return this.shuffle();
  }

  /**
   * Finds matching documents.
   *
   * @return {Query|Array}
   */
  find(query: QueryDefinitionObject, options?: FindOptions & { lean?: false; }): Query;
  find(query: QueryDefinitionObject, options?: FindOptions & { lean?: true; }): Any[];
  find(query: QueryDefinitionObject, options?: FindOptions): Query | Any[];

  find(query: QueryDefinitionObject, options: FindOptions = {}): Query | Any[] {
    const filter = this._schema._execQuery(query);
    const { data, length } = this;
    const { lean = false } = options;
    let { limit = length, skip } = options;
    const arr: Array<Document | Any> = [];

    for (let i = 0; limit && i < length; i++) {
      const item = data[i];

      if (filter(item)) {
        if (skip) {
          skip--;
        } else {
          arr.push(lean ? item.toObject() : item);
          limit--;
        }
      }
    }

    return lean ? arr as Any[] : new Query(arr as Document[]);
  }

  /**
   * Finds the first matching documents.
   *
   * @param {Object} query
   * @param {Object} [options]
   *   @param {Number} [options.skip=0] Skips the first elements.
   *   @param {Boolean} [options.lean=false] Returns a plain JavaScript object.
   * @return {Document|Object}
   */
  findOne(query: QueryDefinitionObject, options?: FindOneOptions & { lean?: false; }): Document;
  findOne(query: QueryDefinitionObject, options?: FindOneOptions & { lean?: true; }): Any;
  findOne(query: QueryDefinitionObject, options?: FindOneOptions): Document | Any;

  findOne(query: QueryDefinitionObject, options_: FindOneOptions = {}): Document | Any {
    const options = options_ as FindOptions;
    options.limit = 1;

    const result = this.find(query, options);
    return isNotQuery(options.lean, result) ? result[0] : result.data[0];
  }

  /**
   * Sorts documents.
   *
   * Example:
   *
   * ``` js
   * query.sort('date', -1);
   * query.sort({date: -1, title: 1});
   * query.sort('-date title');
   * ```
   *
   * If the `order` equals to `-1`, `desc` or `descending`, the data will be
   * returned in reversed order.
   *
   */
  sort(orderBy: string, order: SortOrderSpec): Query;
  sort(orderBy: string): Query;
  sort(orderBy: Dict<SortSpec>): Query;

  sort(orderBy: string | Dict<SortSpec>, order?: SortOrderSpec): Query {
    const sort = parseArgs(orderBy, order);
    const fn = this._schema._execSort(sort);

    return new Query(this.data.slice().sort(fn));
  }

  /**
   * Creates an array of values by iterating each element in the collection.
   *
   */
  map<TResult>(iterator: IterateFn<Document, TResult>): TResult[] {
    const { data, length } = this;
    const result = new Array<TResult>(length);

    for (let i = 0; i < length; i++) {
      result[i] = iterator(data[i], i);
    }

    return result;
  }

  /**
   * Reduces a collection to a value which is the accumulated result of iterating
   * each element in the collection.
   *
   * @param {Function} iterator
   * @param {*} [initial] By default, the initial value is the first document.
   * @return {*}
   */
  reduce(iterator: ReduceFn, initial?: Document): Document {
    const { data, length } = this;
    let result, i;

    if (initial === undefined) {
      i = 1;
      result = data[0];
    } else {
      i = 0;
      result = initial;
    }

    for (; i < length; i++) {
      result = iterator(result, data[i], i);
    }

    return result;
  }

  /**
   * Reduces a collection to a value which is the accumulated result of iterating
   * each element in the collection from right to left.
   *
   */
  reduceRight(iterator: ReduceFn, initial?: Document): Document {
    const { data, length } = this;
    let result, i;

    if (initial === undefined) {
      i = length - 2;
      result = data[length - 1];
    } else {
      i = length - 1;
      result = initial;
    }

    for (; i >= 0; i--) {
      result = iterator(result, data[i], i);
    }

    return result;
  }

  /**
   * Creates a new array with all documents that pass the test implemented by the
   * provided function.
   *
   */
  filter(iterator: FilterFn): Query {
    const { data, length } = this;
    const arr = [];

    for (let i = 0; i < length; i++) {
      const item = data[i];
      if (iterator(item, i)) arr.push(item);
    }

    return new Query(arr);
  }

  /**
   * Tests whether all documents pass the test implemented by the provided
   * function.
   *
   */
  every(iterator: FilterFn): boolean {
    const { data, length } = this;

    for (let i = 0; i < length; i++) {
      if (!iterator(data[i], i)) return false;
    }

    return true;
  }

  /**
   * Tests whether some documents pass the test implemented by the provided
   * function.
   *
   */
  some(iterator: FilterFn): boolean {
    const { data, length } = this;

    for (let i = 0; i < length; i++) {
      if (iterator(data[i], i)) return true;
    }

    return false;
  }

  /**
   * Update all documents.
   *
   * @param {Object} data
   * @param {Function} [callback]
   * @return {Promise}
   */
  update(data, callback) {
    const model = this._model;
    const stack = this._schema._parseUpdate(data);

    return Bluebird.mapSeries(this.data, item => model._updateWithStack(item._id, stack)).asCallback(callback);
  }

  /**
   * Replace all documents.
   *
   * @param {Object} data
   * @param {Function} [callback]
   * @return {Promise}
   */
  replace(data, callback) {
    const model = this._model;

    return Bluebird.map(this.data, item => model.replaceById(item._id, data)).asCallback(callback);
  }

  /**
   * Remove all documents.
   *
   * @param {Function} [callback]
   * @return {Promise}
   */
  remove(callback) {
    const model = this._model;

    return Bluebird.mapSeries(this.data, item => model.removeById(item._id)).asCallback(callback);
  }

  /**
   * Populates document references.
   *
   * @param {String|Object} expr
   * @return {Query}
   */
  populate(expr) {
    const stack = this._schema._parsePopulate(expr);
    const { data, length } = this;
    const model = this._model;

    for (let i = 0; i < length; i++) {
      data[i] = model._populate(data[i], stack);
    }

    return this;
  }
}
