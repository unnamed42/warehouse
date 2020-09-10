// const cloneDeep = require('rfdc')();
import rfdc from 'rfdc';

const cloneDeep = rfdc();

const isGetter = <T>(obj: T, key: string): boolean =>
  Object.getOwnPropertyDescriptor(obj, key)?.get === undefined;

export default class Document<TData> {

  /**
   * Document constructor.
   *
   */
  constructor(data: TData) {
    if (data) {
      Object.assign(this, data);
    }
  }

  /**
   * Saves the document.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  save(callback) {
    return this._model.save(this, callback);
  }

  /**
   * Updates the document.
   *
   * @param {object} data
   * @param {function} [callback]
   * @return {Promise}
   */
  update(data, callback) {
    return this._model.updateById(this._id, data, callback);
  }

  /**
   * Replaces the document.
   *
   * @param {object} data
   * @param {function} [callback]
   * @return {Promise}
   */
  replace(data, callback) {
    return this._model.replaceById(this._id, data, callback);
  }

  /**
   * Removes the document.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  remove(callback) {
    return this._model.removeById(this._id, callback);
  }

  /**
   * Returns a plain JavaScript object.
   *
   */
  toObject(): Any {
    return Object.entries(this).reduce((prev, [key, value]) => {
      prev[key] = isGetter(this, key) ? value : cloneDeep(value);
      return prev;
    }, {} as Any);
  }

  /**
   * Returns a string representing the document.
   *
   */
  toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Populates document references.
   *
   * @param {String|Object} expr
   * @return {Document}
   */
  populate(expr: string | Any): Document {
    const stack = this._schema._parsePopulate(expr);
    return this._model._populate(this, stack);
  }
}
