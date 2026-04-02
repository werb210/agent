import { emitter } from '../realtime/emitter';
import { EVENTS } from '../realtime/events';

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
