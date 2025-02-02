import {Server, Socket} from "socket.io";
import http from "http";
import {validate} from "uuid";

interface JoinMessage {
    channel: string;
}

interface WebRTCPayload {
    channel: string;
    offer: RTCSessionDescription;
    to: string;
    from: string;
}

interface ICEPayload {
    from: string;
    to: string;
    candidate: RTCIceCandidate;
}

interface ClientEvent {
    "join-channel": (joinMessage: JoinMessage) => void;
    "webrtc-offer": (payload: WebRTCPayload) => void;
    "webrtc-answer": (payload: WebRTCPayload) => void;
    "ice-candidate": (payload: ICEPayload) => void;
    "disconnect": () => void;
}

interface ServerEvent {
    "no-channel": () => void;
    "discover-peers": (userIds: string[]) => void;
    "webrtc-offer": (payload: WebRTCPayload) => void;
    "webrtc-answer": (payload: WebRTCPayload) => void;
    "ice-candidate": (payload: ICEPayload) => void;
}

interface RoomData {
    users: string[];
}

function toImmutableSnapshot<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

class WebSocketManager {
    #io: Server;
    #rooms: Record<string, RoomData>;

    constructor(server: http.Server) {
        this.#io = new Server<ClientEvent, ServerEvent>(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                allowedHeaders: ['Content-Type'],
            }
        });
        this.#rooms = {};

        this.#initializeHandlers();
    }

    public get rooms(): Record<string, RoomData> {
        return toImmutableSnapshot<Record<string, RoomData>>(this.#rooms);
    }

    static attach(server: http.Server) {
        console.log("PeerManager instance attached to server");

        return new WebSocketManager(server);
    }

    static detach(wsManager: WebSocketManager, handler: () => void) {
        if (!!wsManager && !!wsManager.#io) {
            wsManager.#io.close()
                .then(_ => handler());
        }
    }

    #initializeHandlers() {
        this.#io.on("connection", (socket: Socket<ClientEvent, ServerEvent>) => {
            console.log("New client connected:", socket.id);

            socket.on("join-channel", (msg: JoinMessage) => this.#handleJoinChannel(socket, msg));
            socket.on("webrtc-offer", (payload: WebRTCPayload) => this.#handleWebRTCOffer(socket, payload));
            socket.on("webrtc-answer", (payload: WebRTCPayload) => this.#handleWebRTCAnswer(socket, payload));
            socket.on("ice-candidate", (payload: ICEPayload) => this.#handleICECandidate(socket, payload));
            socket.on("disconnect", () => this.#handleDisconnect(socket));
        });
    }

    #handleJoinChannel(socket: Socket<ClientEvent, ServerEvent>, joinMessage: JoinMessage) {
        if (this.#rooms[joinMessage.channel]) {
            socket.emit("discover-peers", this.#rooms[joinMessage.channel].users);
            this.#rooms[joinMessage.channel].users.push(socket.id);
        } else if (validate(joinMessage.channel)) {
            this.#rooms[joinMessage.channel] = {users: [socket.id]};
            console.log("New channel created: ", joinMessage.channel);
        } else {
            console.log(socket.id);
            socket.emit("no-channel");
        }
    }

    #handleWebRTCOffer(socket: Socket<ClientEvent, ServerEvent>, payload: WebRTCPayload) {
        console.log("Offer received from " + payload.from + " to " + payload.to);
        socket.to(payload.to).emit("webrtc-offer", payload);
    }

    #handleWebRTCAnswer(socket: Socket<ClientEvent, ServerEvent>, payload: WebRTCPayload) {
        console.log("Answer received from", payload.from + " to " + payload.to);
        socket.to(payload.to).emit("webrtc-answer", payload);
    }

    #handleICECandidate(socket: Socket<ClientEvent, ServerEvent>, payload: ICEPayload) {
        console.log("ICE Candidate received from " + payload.from + " to " + payload.to);
        socket.to(payload.to).emit("ice-candidate", payload);
    }

    #handleDisconnect(socket: Socket<ClientEvent, ServerEvent>) {
        console.log("Client disconnected:", socket.id);

        const channel = Object.keys(this.#rooms).find(ch =>
            this.#rooms[ch].users.includes(socket.id)
        );

        if (channel) {
            if (this.#rooms[channel] && this.#rooms[channel].users.length === 1) {
                // remove channel if this is the last user connected
                console.log("Channel deleted: ", channel);
                delete this.#rooms[channel];
            } else {
                this.#rooms[channel].users = this.#rooms[channel].users.filter(id => id !== socket.id);
            }
        }
    }
}

export {WebSocketManager};