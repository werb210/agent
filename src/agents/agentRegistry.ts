import { AppError } from "../errors/AppError.js";
export type AgentType = "sales" | "marketing" | "risk";

export interface MayaAgent<TInput = unknown, TOutput = unknown> {
  execute(input: TInput): Promise<TOutput>;
}

const registry: Partial<Record<AgentType, MayaAgent>> = {};

export function registerAgent(type: AgentType, agent: MayaAgent): void {
  registry[type] = agent;
}

export function getAgent(type: AgentType): MayaAgent {
  const agent = registry[type];

  if (!agent) {
    throw new AppError("not_found", 404, `Agent '${type}' has not been registered.`);
  }

  return agent;
}
