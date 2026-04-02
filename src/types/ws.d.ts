declare module "ws" {
  import http from "http";
  import { EventEmitter } from "events";

  export default class WebSocket extends EventEmitter {
    close(): void;
    on(event: "message", listener: (data: unknown) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
  }

  export class WebSocketServer extends EventEmitter {
    constructor(options: { server: http.Server; path: string });
    on(event: "connection", listener: (ws: WebSocket) => void): this;
  }
}
