import {io} from "socket.io-client";
import {signalingServer} from "../data/defaults";

class PeerManager {
    #socket = null;
    #localWebcamStream = null;
    #shouldDisconnect = false;

    #peerConnections = {};

    constructor() {
    }

    connect(channelName, configurations, localWebcamStream, setIsActive, setRemoteVideoStreams) {
        this.#socket = io(signalingServer);
        this.#socket.connect();
        this.#localWebcamStream = localWebcamStream;
        this.joinChannel(channelName, configurations, setIsActive, setRemoteVideoStreams);
    }

    joinChannel(channelName, configurations, setIsActive, setRemoteVideoStreams) {
        this.attachSocketHandlers(channelName, configurations, setIsActive, setRemoteVideoStreams);
        this.#socket.emit("join-channel", {channel: channelName});
        setIsActive(true);
    }

    attachSocketHandlers(channelName, configurations, setIsActive, setRemoteVideoStreams) {
        this.attachJoinSocketHandlers(channelName, configurations, setIsActive, setRemoteVideoStreams);
        this.attachUserJoinedSocketHandlers(channelName, configurations, setIsActive, setRemoteVideoStreams);
        this.attachCommonHandlers(channelName);
    }

    async attachJoinSocketHandlers(channelName, configurations, setIsActive, setRemoteVideoStreams) {
        this.#socket.on("no-channel", () => {
            this.disconnect(setIsActive, setRemoteVideoStreams);
            console.log("The channel was not found");
        });

        this.#socket.on("discover-peers", async (peers) => {
            console.log(`Discovered ${peers.length} peers`);

            for (const socketId of peers) {
                const peerConnection = new RTCPeerConnection({
                    iceServers: configurations,
                    iceTransportPolicy: "all",
                    bundlePolicy: "max-bundle",
                    rtcpMuxPolicy: "require",
                    sdpSemantics: "unified-plan",
                    iceCandidatePoolSize: 10
                });

                this.#peerConnections[socketId] = peerConnection;

                this.#localWebcamStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, this.#localWebcamStream);
                    console.log("Associated track with peer: " + track.kind);
                });

                peerConnection.ontrack = (event) => {
                    const mediaStream = event.streams[0];
                    setRemoteVideoStreams((mediaStreams) => ({...mediaStreams, [socketId]: mediaStream}));
                    console.log("Received track from remote peer");
                };

                peerConnection.onconnectionstatechange = () => {
                    switch (peerConnection.connectionState) {
                        case "connected":
                            console.log("Established connection!");
                            break;
                        case "disconnected":
                            this.handlePeerDisconnect(peerConnection, socketId, setRemoteVideoStreams);

                            if (this.#shouldDisconnect) {
                                console.log("Disconnected gracefully triggered locally");
                            } else {
                                console.log("Unexpected disconnection triggered by remote peer");
                                break;
                            }
                    }
                }

                peerConnection.onicecandidate = (event) => {
                    if (event.candidate) {
                        this.#socket.emit("ice-candidate", {
                            channel: channelName,
                            from: this.#socket.id,
                            to: socketId,
                            candidate: event.candidate
                        });

                        console.log("Sent ICE candidate to remote peer");
                    }
                }

                const offer = await peerConnection.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true});
                await peerConnection.setLocalDescription(offer);

                this.#socket.emit("webrtc-offer", {
                    channel: channelName,
                    to: socketId,
                    sdp: offer,
                    from: this.#socket.id
                });

                console.log("Sent offer to remote peer");
            }
        });

        this.#socket.on("webrtc-answer", (payload) => {
            console.log("Received answer from remote peer");

            this.#peerConnections[payload.from].setRemoteDescription(new RTCSessionDescription(payload.sdp))
                .catch(error => console.error("Error setting remote description:", error));
        });
    }

    async attachUserJoinedSocketHandlers(channelName, configurations, setIsActive, setRemoteVideoStreams) {
        this.#socket.on("webrtc-offer", async (payload) => {
            console.log("Received offer from remote peer");

            const socketId = payload.from;

            const peerConnection = new RTCPeerConnection({
                iceServers: configurations,
                iceTransportPolicy: "all",
                bundlePolicy: "max-bundle",
                rtcpMuxPolicy: "require",
                sdpSemantics: "unified-plan",
                iceCandidatePoolSize: 10
            });

            this.#peerConnections[socketId] = peerConnection;

            this.#localWebcamStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.#localWebcamStream);
                console.log("Associated track with peer: " + track.kind);
            });

            peerConnection.ontrack = (event) => {
                const mediaStream = event.streams[0];
                setRemoteVideoStreams((mediaStreams) => ({...mediaStreams, [socketId]: mediaStream}));
                console.log("Received track from remote peer");
            };

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.#socket.emit("ice-candidate", {
                        channel: channelName,
                        from: this.#socket.id,
                        to: socketId,
                        candidate: event.candidate
                    });

                    console.log("Sent ICE candidate to remote peer");
                }
            };

            peerConnection.onconnectionstatechange = () => {
                console.log(peerConnection.connectionState);

                switch (peerConnection.connectionState) {
                    case "connected":
                        console.log("Established connection!");
                        break;
                    case "disconnected":
                        this.handlePeerDisconnect(peerConnection, socketId, setRemoteVideoStreams);

                        if (this.#shouldDisconnect) {
                            console.log("Disconnected gracefully triggered locally");
                        } else {
                            console.log("Unexpected disconnection triggered by remote peer");
                            break;
                        }
                }
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            this.#socket.emit("webrtc-answer", {
                channel: channelName,
                sdp: answer,
                from: this.#socket.id,
                to: socketId
            });

            console.log("Sent answer to remote peer");
        });
    }

    attachCommonHandlers() {
        this.#socket.on("ice-candidate", (payload) => {
            console.log("Received ICE candidate from remote peer");

            this.#peerConnections[payload.from].addIceCandidate(new RTCIceCandidate(payload.candidate))
                .catch(error => console.error("Error adding ICE candidate:", error));
        });
    }

    handlePeerDisconnect(peerConnection, socketId, setRemoteVideoStreams) {
        delete this.#peerConnections[socketId];
        setRemoteVideoStreams(remoteStreams => Object.fromEntries(Object.entries(remoteStreams).filter(([key]) => key !== socketId)));
    }

    disconnect(setIsActive, setRemoteVideoStreams) {
        if(this.#socket) {
            this.#socket.disconnect();
        }

        setRemoteVideoStreams([]);
        setIsActive(false);

        Object.values(this.#peerConnections).forEach(peerConnection => peerConnection.close());
        this.#peerConnections = {};
    }
}

export default PeerManager;