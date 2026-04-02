import { EventEmitter } from 'events';

export const emitter = new EventEmitter();

emitter.setMaxListeners(25);
