import "dotenv/config";

import express from 'express';
import http from "http";
import { WebSocketManager } from "./WebSocketManager";
import { attachGracefulShutdownHandler } from "./shutdown";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const wsManager = WebSocketManager.attach(server);

app.use(cors());

app.get("/api/generate-token", (_, res) => {
  res.send({ "token": uuidv4() });
})

if (process.env.NODE_ENV === "production") {
  const DEFAULT_FE_RELATIVE_LOCATION = "front-end/dist";
  const FE_ABSOLUTE_LOCATION = process.env.FE_LOCATION || path.join(path.dirname(fileURLToPath(import.meta.url)), "../..", DEFAULT_FE_RELATIVE_LOCATION);

  app.use(express.static(FE_ABSOLUTE_LOCATION));
  app.get('*', (_, res) => {
    res.sendFile(path.join(FE_ABSOLUTE_LOCATION, 'index.html'));
  });
}

attachGracefulShutdownHandler(wsManager, server);

server.listen(PORT, () => {
  console.log("Signaling server started on http://localhost:" + PORT);
})
