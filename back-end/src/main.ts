import "dotenv/config";

import express from 'express';
import http from "http";
import {WebSocketManager} from "./WebSocketManager";
import {attachGracefulShutdownHandler} from "./shutdown";
import {v4 as uuidv4} from "uuid";
import cors from "cors";

const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const wsManager = WebSocketManager.attach(server);

app.use(cors());


app.get("/api/generate-token", (req, res) => {
    res.send({"token": uuidv4()});
})

attachGracefulShutdownHandler(wsManager, server);

server.listen(PORT, () => {
    console.log("Signaling server started on http://localhost:" + PORT);
})
