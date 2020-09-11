export default class WarehouseError extends Error {

  static ID_EXIST = 'ID_EXIST';
  static ID_NOT_EXIST = 'ID_NOT_EXIST';
  static ID_UNDEFINED = 'ID_UNDEFINED';

  /**
   * WareHouse constructor.
   *
   */
  constructor(msg: string, public code?: string) {
    super(msg);

    Error.captureStackTrace(this);
  }
}
