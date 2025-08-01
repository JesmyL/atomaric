type Sunscriber<Value> = (value: Value) => void;

export class Atom<Value> {
  private value: Value;
  private readonly subscribers = new Set<Sunscriber<Value>>();
  private readonly save: (val: Value) => void = () => {};
  private readonly invokeSubscriber = (sub: Sunscriber<Value>) => sub(this.value);

  constructor(private _defaultValue: Value, storeKey: `${string}${string}:${string}${string}` | undefined) {
    if (storeKey !== undefined) {
      const key = `atom/${storeKey}`;

      this.value = key in localStorage ? JSON.parse(localStorage[key]) : _defaultValue;
      this.save = value => {
        if (value === _defaultValue) {
          this.reset();
          return;
        }
        localStorage[key] = JSON.stringify(value);
      };

      this.reset = () => {
        delete localStorage[key];
        this.set(_defaultValue, true);
      };
    } else {
      this.value = _defaultValue;
      this.reset = () => {
        this.set(_defaultValue, true);
        this.subscribers.forEach(this.invokeSubscriber, this);
      };
    }

    if (typeof _defaultValue !== 'boolean') this.toggle = () => {};
    if (typeof _defaultValue !== 'number') this.inkrement = () => {};
  }

  get defaultValue() {
    return this._defaultValue;
  }

  readonly get = () => this.value;
  readonly reset: () => void;
  readonly toggle = () => this.set(!this.value as never);
  readonly inkrement = (delta: number) => this.set(((this.value as number) + delta) as never);

  readonly subscribe = (sub: Sunscriber<Value>) => {
    this.subscribers.add(sub);
    return () => {
      this.subscribers.delete(sub);
    };
  };

  readonly set = (value: Value | ((prev: Value) => Value), isPreventSave?: boolean) => {
    const val = typeof value === 'function' ? (value as (value: Value) => Value)(this.value) : value;
    if (val === this.value || val === undefined || (typeof val === 'number' && isNaN(val))) return;

    this.value = val;
    this.subscribers.forEach(this.invokeSubscriber, this);

    if (isPreventSave !== true) this.save(val);
  };
}
