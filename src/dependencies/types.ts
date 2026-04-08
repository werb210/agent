export type DependencyState = "available" | "unavailable";

export interface DependencyStatus {
  state: DependencyState;
  mode: "live" | "mock";
  detail?: string;
}

export interface RuntimeDependencies {
  db: {
    ping: () => Promise<DependencyStatus>;
    close: () => Promise<void>;
  };
  redis: {
    ping: () => Promise<DependencyStatus>;
    close: () => Promise<void>;
  };
  openai: {
    ping: () => Promise<DependencyStatus>;
  };
  twilio: {
    ping: () => Promise<DependencyStatus>;
  };
  externalApi: {
    ping: () => Promise<DependencyStatus>;
  };
  closeAll: () => Promise<void>;
}
