import { EventEmitter } from "events";
import { AgentType } from "./agentRegistry";

export interface AgentBusMessage {
  from: AgentType;
  to: AgentType | "orchestrator";
  topic: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

const bus = new EventEmitter();

export function publishAgentMessage(message: Omit<AgentBusMessage, "createdAt">): AgentBusMessage {
  const enrichedMessage: AgentBusMessage = {
    ...message,
    createdAt: new Date()
  };

  bus.emit("agent-message", enrichedMessage);
  return enrichedMessage;
}

export function onAgentMessage(listener: (message: AgentBusMessage) => void): void {
  bus.on("agent-message", listener);
}
