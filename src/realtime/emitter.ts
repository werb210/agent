import { MayaEvent } from "./events";

type Listener = (event: MayaEvent) => void;

const listeners: Listener[] = [];

export function emit(event: MayaEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

export function subscribe(fn: Listener) {
  listeners.push(fn);
}
