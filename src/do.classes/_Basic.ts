export class AtomDoActionsBasic {
  constructor(actions: Record<string, Function> | nil) {
    if (actions)
      return new Proxy(this, {
        get: (self, p) => {
          if (p in this) return self[p as never];
          return actions[p as never];
        },
      });
  }
}
