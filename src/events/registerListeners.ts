import { emitter } from '../realtime/emitter.js';
import { EVENTS } from '../realtime/events.js';

let listenersRegistered = false;

export function registerListeners() {
  if (listenersRegistered) {
    return;
  }

  listenersRegistered = true;

  emitter.on(EVENTS.TOOL_EXECUTED, (payload: unknown) => {
    console.log('Tool executed:', payload);
  });
}
