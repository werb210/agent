import { MayaAction } from '../types/actions.js';
import { validateToolCall } from '../core/validateTool.js';

export function parseToolCall(input: any) {
  if (!input?.tool_calls?.length) return null;

  return input.tool_calls[0];
}

export function interpretAction(aiReply: string): MayaAction {
  try {
    const parsed = JSON.parse(aiReply) as { tool_calls?: unknown[]; tool_call?: unknown; tool?: string };
    const rawToolCall = parseToolCall(parsed) ?? parsed.tool_call;
    const toolCall = rawToolCall ? validateToolCall(rawToolCall) : null;
    const toolName = toolCall?.name ?? parsed.tool;

    if (toolName === 'scheduleAppointment') {
      return { type: 'book', requiresConfirmation: true };
    }
    if (toolName === 'transferCall') {
      return { type: 'transfer', requiresConfirmation: true };
    }
  } catch {
    // no-op: non-JSON responses map to no action
  }

  return {
    type: 'none',
    requiresConfirmation: false,
  };
}
