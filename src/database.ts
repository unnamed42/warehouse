// eslint-disable-next-line import/no-unresolved
import * as JSONStream from 'JSONStream';
import Bluebird from 'bluebird';
// workaround complaints about no default exports of rule import/default
import { default as fs } from 'graceful-fs';
import * as stream from 'stream';
import Model from './model';
import Schema, { SchemaDefinition } from './schema';
import SchemaType from './schematype';
import WarehouseError from './error';

import type { FileHandle } from 'fs/promises';

const { open } = fs.promises;
const pipeline = Bluebird.promisify(stream.pipeline);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json') as { version: string; };

const _writev = typeof fs.writev === 'function'
  ? (handle: FileHandle, buffers: NodeJS.ArrayBufferView[]) => handle.writev(buffers)
  : async (handle: FileHandle, buffers: Array<string | Uint8Array>) => {
    for (const buffer of buffers) await handle.write(buffer);
  };

async function exportAsync(database: Database, path: fs.PathLike) {
  const handle = await open(path, 'w');

  try {
    // Start body & Meta & Start models
    await handle.write(`{"meta":${JSON.stringify({
      version: database.options.version,
      warehouse: pkg.version
    })},"models":{`);

    const models = database._models;
    const keys = Object.keys(models);
    const { length } = keys;

    // models body
    for (let i = 0; i < length; i++) {
      const key = keys[i];

      if (!models[key]) continue;

      const buffers = [];

      if (i) buffers.push(Buffer.from(',', 'ascii'));

      buffers.push(Buffer.from(`"${key}":`));

      buffers.push(Buffer.from(models[key]._export()));
      await _writev(handle, buffers);
    }

    // End models
    await handle.write('}}');
  } finally {
    await handle.close();
  }
}

export interface DatabaseMeta {
  meta: {
    version: number;
    warehouse: string;
  };
  models: Dict<Model>;
}

export interface DatabaseOptions {

  /**
   * Database version
   */
  version: number;

  /**
   * Database path
   */
  path?: string;

  /**
   * Triggered when the database is upgraded
   */
  onUpgrade: (oldVersion: number, newVersion: number) => void;

  /**
   * Triggered when the database is downgraded
   */
  onDowngrade: (oldVersion: number, newVersion: number) => void;
}

export default class Database {

  static version: string = pkg.version;

  readonly Schema = typeof Schema;
  readonly SchemaType = typeof SchemaType;
  static Schema = Database.prototype.Schema;
  static SchemaType = Database.prototype.SchemaType;

  readonly Model: typeof Model;

  public options: DatabaseOptions;
  readonly _models: Dict<Model>;

  constructor(options: Partial<DatabaseOptions>) {
    this.options = Object.assign({
      version: 0,
      onUpgrade() {},
      onDowngrade() {}
    }, options);

    this._models = {};

    class _Model extends Model {}
    this.Model = _Model;
    _Model.prototype._database = this;
  }

  /**
   * Creates a new model.
   *
   */
  model(name: string, schema?: Schema | SchemaDefinition): Model {
    if (this._models[name]) {
      return this._models[name];
    }

    this._models[name] = new this.Model(name, schema);
    const model = this._models[name];
    return model;
  }

  /**
   * Loads database.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  load(callback: () => void): Promise<void> {
    const { path, onUpgrade, onDowngrade, version: newVersion } = this.options;

    if (!path) throw new WarehouseError('options.path is required');

    let oldVersion = 0;

    const getMetaCallBack = (data: DatabaseMeta) => {
      if (data.meta && data.meta.version) {
        oldVersion = data.meta.version;
      }
    };

    // data event arg0 wrap key/value pair.
    const parseStream = JSONStream.parse('models.$*');

    parseStream.once('header', getMetaCallBack);
    parseStream.once('footer', getMetaCallBack);

    parseStream.on('data', data => {
      this.model(data.key)._import(data.value);
    });

    const rs = fs.createReadStream(path, 'utf8');

    return pipeline(rs, parseStream).then(() => {
      if (newVersion > oldVersion) {
        return onUpgrade(oldVersion, newVersion);
      } else if (newVersion < oldVersion) {
        return onDowngrade(oldVersion, newVersion);
      }
    }).asCallback(callback);
  }

  /**
   * Saves database.
   *
   */
  save(callback: () => void): Promise<void> {
    const { path } = this.options;

    if (!path) throw new WarehouseError('options.path is required');
    return Bluebird.resolve(exportAsync(this, path)).asCallback(callback);
  }

  toJSON(): DatabaseMeta {
    const models = Object.keys(this._models)
      .reduce((obj, key) => {
        const value = this._models[key];
        if (value != null) obj[key] = value;
        return obj;
      }, {} as Record<string, Model>);

    return {
      meta: {
        version: this.options.version,
        warehouse: pkg.version
      }, models
    };
  }
}
