export class SuperAtom<Value> {
  private value: Value;

  constructor(defaultValue: Value) {
    this.value = defaultValue;
    this.getDefaultValue = () => defaultValue;
  }

  protected getValue() {
    return this.value;
  }
  protected setValue(value: Value) {
    this.value = value;
  }

  protected getDefaultValue() {
    return null as Value;
  }
}
