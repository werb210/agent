export type AdapterStatus = "ok" | "degraded" | "down";

export interface RuntimeDependencyAdapter {
  status: () => Promise<AdapterStatus>;
  close?: () => Promise<void>;
}

export interface RuntimeDependencies {
  db: RuntimeDependencyAdapter;
  redis: RuntimeDependencyAdapter;
  openai: RuntimeDependencyAdapter;
  twilio: RuntimeDependencyAdapter;
  externalApi: RuntimeDependencyAdapter;
  initAll: () => Promise<void>;
  closeAll: () => Promise<void>;
}
