export class SuperAtom<Value> {
  private value: Value;

  constructor(_defaultValue: Value) {
    this.value = _defaultValue;
  }

  protected getValue() {
    return this.value;
  }
  protected setValue(value: Value) {
    this.value = value;
  }
}
