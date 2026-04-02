import http from "http";
import WebSocket, { WebSocketServer } from "ws";

export function createVoiceServer(server: http.Server) {
  const wss = new WebSocketServer({ server, path: "/ws/voice" });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (msg: unknown) => {
      if (!msg) {
        return;
      }
    });

    ws.on("error", () => {
      ws.close();
    });
  });

  return wss;
}
