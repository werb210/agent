import WebSocket, { WebSocketServer } from "ws";

export function startWS(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", async (msg) => {
      console.log("voice stream chunk");
      // placeholder for realtime voice AI
    });
  });
}
