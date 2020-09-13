import Bluebird from 'bluebird';
import type Document from '@/document';
import type Model from '@/model';
import { Types, ValueType } from '@/types';
import SchemaTypeVirtual from '@/types/virtual';
import { delProp, getProp, setProp } from '@/util';
import PopulationError from '@/error/population';
import SchemaType, { SchemaOptions } from '@/schematype';
import { QueryParser } from './queryparser';
import { UpdateParser } from './updateparser';

type BuiltinConstructors =
  typeof String | typeof Number | typeof Boolean | typeof Array |
  typeof Object | typeof Date | typeof Buffer;

type WrappedBuiltinConstructors =
  { type: BuiltinConstructors; };

export type SchemaTypeDefinition =
  { type: typeof SchemaType } & SchemaOptions;

export type SchemaBuiltinsDefinition =
  BuiltinConstructors | WrappedBuiltinConstructors;

export type SchemaDefinitionItem =
  SchemaTypeDefinition | SchemaBuiltinsDefinition | (SchemaTypeDefinition | SchemaBuiltinsDefinition)[];

export type SchemaDefinition =
  Record<string, SchemaDefinitionItem>;

// type SchemaConstructedTypes =
//   InstanceType<BuiltinConstructors> | InstanceType<ValueOf<typeof Types>>;

const builtins = ['String', 'Number', 'Boolean', 'Array', 'Object', 'Date', 'Buffer'] as const;
const builtinTypes = new Set(builtins);

const isBuiltinTypes = (type: BuiltinConstructors | typeof SchemaType): type is BuiltinConstructors => {
  const typeName = type.name as (typeof builtins)[number];
  return builtinTypes.has(typeName);
};

const getSchemaType = (
  name: string,
  options: SchemaTypeDefinition | SchemaBuiltinsDefinition
): SchemaType => {
  const Type = 'type' in options ? options.type : options;

  if (isBuiltinTypes(Type)) {
    return new Types[Type.name](name, options as SchemaOptions);
  }

  return new Type(name, options as SchemaOptions);
};

type Visitor = (data: unknown) => void;
type Getter = (this: ValueType) => ValueType;

interface SchemaStacks {
  getter: Visitor[];
  setter: Visitor[];
  import: Visitor[];
  export: Visitor[];
}

type HookType = 'save' | 'remove';

const checkHookType = (type: string) => {
  if (type !== 'save' && type !== 'remove') {
    throw new TypeError('Hook type must be `save` or `remove`!');
  }
};

type Resolvable<T> = T | PromiseLike<T>;

type Fn0<R> = () => Resolvable<R>;
type Fn1<T, R> = (arg: T) => Resolvable<R>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn2<T, R> = (arg: T, callback: (err: any, result?: R) => void) => void;

function hookWrapper<R>(fn: Fn0<R>): () => Bluebird<R>;
function hookWrapper<T, R>(fn: Fn1<T, R>): (arg: T) => Bluebird<R>;
function hookWrapper<T, R>(fn: Fn2<T, R>): (arg: T) => Bluebird<R>;

function hookWrapper<T, R>(
  fn: Fn0<R> | Fn1<T, R> | Fn2<T, R>
): (() => Bluebird<R>) | ((arg: T) => Bluebird<R>) {
  if (fn.length > 1) {
    return Bluebird.promisify(fn as Fn2<T, R>);
  }

  return Bluebird.method(fn as Fn0<R> | Fn1<T, R>);
}

type DocumentMethod = (this: Document) => void;
type ModelMethod = (this: Model) => void;

export default class Schema {

  static Types = Types;

  readonly Types = Schema.Types;

  private readonly paths: Record<string, SchemaType>;
  readonly statics: Record<string, ModelMethod>;
  readonly methods: Record<string, DocumentMethod>;
  private readonly hooks: {
    pre: {
      save: Any[];
      remove: Any[];
    },
    post: {
      save: Any[];
      remove: Any[];
    }
  };
  private readonly stacks: SchemaStacks;

  /**
   * Schema constructor.
   *
   */
  constructor(schema?: SchemaDefinition) {
    this.paths = {};
    this.statics = {};
    this.methods = {};

    this.hooks = {
      pre: {
        save: [],
        remove: []
      },
      post: {
        save: [],
        remove: []
      }
    };

    this.stacks = {
      getter: [],
      setter: [],
      import: [],
      export: []
    };

    if (schema) {
      this.add(schema);
    }
  }

  /**
   * Adds paths.
   *
   */
  add(schema: SchemaDefinition, prefix = ''): void {
    const keys = Object.keys(schema);
    const len = keys.length;

    if (!len) return;

    for (let i = 0; i < len; i++) {
      const key = keys[i];
      const value = schema[key];

      this.path(prefix + key, value);
    }
  }

  /**
   * Gets/Sets a path.
   *
   */
  path(name: string, obj?: SchemaDefinitionItem | SchemaType | null): SchemaType | undefined {
    if (obj == null) {
      return this.paths[name];
    }

    let type: SchemaType;
    let nested = false;

    if (obj instanceof SchemaType) {
      type = obj;
    } else {
      switch (typeof obj) {
        case 'function':
          type = getSchemaType(name, { type: obj });
          break;

        case 'object':
          if ('type' in obj) {
            type = getSchemaType(name, obj);
          } else if (Array.isArray(obj)) {
            type = new Types.Array(name, {
              child: obj.length ? getSchemaType(name, obj[0]) : new SchemaType(name)
            });
          } else {
            type = new Types.Object();
            nested = Object.keys(obj).length > 0;
          }

          break;

        default:
          throw new TypeError(`Invalid value for schema path \`${name}\``);
      }
    }

    this.paths[name] = type;
    this._updateStack(name, type);

    if (nested) this.add(obj as SchemaDefinition, `${name}.`);
  }

  /**
   * Updates cache stacks.
   *
   */
  private _updateStack(name: string, type: SchemaType): void {
    const { stacks } = this;

    stacks.getter.push(data => {
      const value = getProp(data, name) as ValueType;
      const result = type.cast(value, data);

      if (result !== undefined) {
        setProp(data, name, result);
      }
    });

    stacks.setter.push(data => {
      const value = getProp(data, name) as ValueType;
      const result = type.validate(value, data);

      if (result !== undefined) {
        setProp(data, name, result);
      } else {
        delProp(data, name);
      }
    });

    stacks.import.push(data => {
      const value = getProp(data, name) as ValueType;
      const result = type.parse(value, data);

      if (result !== undefined) {
        setProp(data, name, result);
      }
    });

    stacks.export.push(data => {
      const value = getProp(data, name) as ValueType;
      const result = type.value(value, data);

      if (result !== undefined) {
        setProp(data, name, result);
      } else {
        delProp(data, name);
      }
    });
  }

  /**
   * Adds a virtual path.
   *
   */
  virtual(name: string, getter: Getter): SchemaTypeVirtual {
    const virtual = new Types.Virtual(name, {});
    if (getter) virtual.get(getter);

    this.path(name, virtual);

    return virtual;
  }

  /**
   * Adds a pre-hook.
   *
   * @param {String} type Hook type. One of `save` or `remove`.
   * @param {Function} fn
   */
  pre(type: HookType, fn: () => void): void {
    checkHookType(type);
    if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

    this.hooks.pre[type].push(hookWrapper(fn));
  }

  /**
   * Adds a post-hook.
   *
   * @param {String} type Hook type. One of `save` or `remove`.
   * @param {Function} fn
   */
  post(type: HookType, fn) {
    checkHookType(type);
    if (typeof fn !== 'function') throw new TypeError('Hook must be a function!');

    this.hooks.post[type].push(hookWrapper(fn));
  }

  /**
   * Adds a instance method.
   *
   */
  method(name: string, fn: DocumentMethod): void {
    if (!name) throw new TypeError('Method name is required!');

    if (typeof fn !== 'function') {
      throw new TypeError('Instance method must be a function!');
    }

    this.methods[name] = fn;
  }

  /**
   * Adds a static method.
   *
   */
  static(name: string, fn: ModelMethod): void {
    if (!name) throw new TypeError('Method name is required!');

    if (typeof fn !== 'function') {
      throw new TypeError('Static method must be a function!');
    }

    this.statics[name] = fn;
  }

  /**
   * Apply getters.
   *
   */
  _applyGetters(data: unknown): void {
    const stack = this.stacks.getter;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }
  }

  /**
   * Apply setters.
   *
   */
  _applySetters(data: unknown): void {
    const stack = this.stacks.setter;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }
  }

  /**
   * Parses database.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */
  private _parseDatabase(data: unknown): unknown {
    const stack = this.stacks.import;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }

    return data;
  }

  /**
   * Exports database.
   *
   * @param {Object} data
   * @return {Object}
   * @private
   */
  private _exportDatabase(data: unknown): unknown {
    const stack = this.stacks.export;

    for (let i = 0, len = stack.length; i < len; i++) {
      stack[i](data);
    }

    return data;
  }

  /**
   * Parses updating expressions and returns a stack.
   *
   * @param {Object} updates
   * @return {queryCallback[]}
   * @private
   */
  private _parseUpdate(updates) {
    return new UpdateParser(this.paths).parseUpdate(updates);
  }

  /**
   * Returns a function for querying.
   *
   * @param {Object} query
   * @return {queryFilterCallback}
   * @private
   */
  private _execQuery(query) {
    return new QueryParser(this.paths).execQuery(query);
  }


  /**
   * Parses sorting expressions and returns a stack.
   *
   * @param {Object} sorts
   * @param {string} [prefix]
   * @param {queryParseCallback[]} [stack]
   * @return {queryParseCallback[]}
   * @private
   */
  _parseSort(sorts: Any, prefix = '', stack = []) {
    const { paths } = this;
    const keys = Object.keys(sorts);

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      const sort = sorts[key];
      const name = prefix + key;

      if (typeof sort === 'object') {
        this._parseSort(sort, `${name}.`, stack);
      } else {
        stack.push(sortStack(paths[name], name, sort));
      }
    }

    return stack;
  }

  /**
   * Returns a function for sorting.
   *
   * @param {Object} sorts
   * @return {queryParseCallback}
   * @private
   */
  _execSort(sorts) {
    const stack = this._parseSort(sorts);
    return execSortStack(stack);
  }

  /**
   * Parses population expression and returns a stack.
   *
   * @param {String|Object} expr
   * @return {PopulateResult[]}
   * @private
   */
  _parsePopulate(expr) {
    const { paths } = this;
    const arr = [];

    if (typeof expr === 'string') {
      const split = expr.split(' ');

      for (let i = 0, len = split.length; i < len; i++) {
        arr[i] = { path: split[i] };
      }
    } else if (Array.isArray(expr)) {
      for (let i = 0, len = expr.length; i < len; i++) {
        const item = expr[i];

        arr[i] = typeof item === 'string' ? { path: item } : item;
      }
    } else {
      arr[0] = expr;
    }

    for (let i = 0, len = arr.length; i < len; i++) {
      const item = arr[i];
      const key = item.path;

      if (!key) {
        throw new PopulationError('path is required');
      }

      if (!item.model) {
        const path = paths[key];
        const ref = path.child ? path.child.options.ref : path.options.ref;

        if (!ref) {
          throw new PopulationError('model is required');
        }

        item.model = ref;
      }
    }

    return arr;
  }
}
