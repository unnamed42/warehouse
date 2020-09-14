type Fn = () => void;

export default class Mutex {
  private _locked = false;
  private _queue: Array<Fn> = [];

  lock(fn: Fn): void {
    if (this._locked) {
      this._queue.push(fn);
      return;
    }

    this._locked = true;
    fn();
  }

  unlock(): void {
    if (!this._locked) return;

    const next = this._queue.shift();

    if (next) {
      next();
    } else {
      this._locked = false;
    }
  }
}
