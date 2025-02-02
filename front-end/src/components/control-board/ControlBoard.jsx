import {useEffect, useRef, useState} from "react";
import Video from "../video/Video";
import PeerManager from "../../sockets/PeerManager.js";
import {defaultConfigurations} from "../../data/defaults";
import {useParams} from "react-router";
import MediaStreamManager from "../../streams/MediaStreamManager.js";
import Button from "../button/Button.jsx";
import Preview from "../preview/Preview.jsx";
import logoWeb from "../../assets/logo-phony.png";

const ControlBoard = () => {
    const configurations = useRef(JSON.parse(JSON.stringify(defaultConfigurations)));

    const params = useParams();
    const room = params.id;

    const peerManager = useRef(null);
    const mediaStreamManager = useRef(null);

    const [isActive, setIsActive] = useState(false);
    const [webcamStatus, setWebcamStatus] = useState(true);
    const [micStatus, setMicStatus] = useState(true);

    const [localMediaStream, setLocalMediaStream] = useState(null);
    const [remoteMediaStreams, setRemoteMediaStreams] = useState([]);

    useEffect(() => {
        async function captureLocalMedia() {
            const mdm = new MediaStreamManager();
            mediaStreamManager.current = mdm;

            await mdm.captureLocalStream();
            setLocalMediaStream(mdm.localStreamCapture);
        }

        captureLocalMedia();
        peerManager.current = new PeerManager();

        return () => {
            stop();

            if (mediaStreamManager.current) {
                setLocalMediaStream(null);
                mediaStreamManager.current.stopLocalStreamCapture();
            }
        }
    }, [])

    const toggleWebcam = () => {
        setWebcamStatus(mediaStreamManager.current.toggleWebcam());
    }

    const toggleMic = () => {
        setMicStatus(mediaStreamManager.current.toggleMicrophone());
    }

    const start = () => {
        if (peerManager) {
            peerManager.current.connect(room, configurations.current, localMediaStream, setIsActive, setRemoteMediaStreams);
        }
    }

    const stop = () => {
        if (peerManager) {
            peerManager.current.disconnect(setIsActive, setRemoteMediaStreams);
        }
    }

    return (
        <>
            <img className="fixed top-0 left-0 w-24" src={logoWeb} alt="logo web"></img>
            <h1 className={"text-right"}>room</h1>
            <h1 className={"text-right"}>{room}</h1>
            <div className={"h-[75vh] flex justify-center items-center gap-2 mt-6 flex-wrap overflow-y-auto"}>
                {!isActive ?
                    <Video preview={true} videoStream={localMediaStream}/>
                    :
                    Object.values(remoteMediaStreams).map((remoteStream, index) => <Video key={index} controls={true}
                                                                                          videoStream={remoteStream}/>)
                }
            </div>
            <div className="flex justify-center gap-2 pt-4">
                {!isActive ?
                    <Button text="Connect" onClick={start}/>
                    : <Button text="Disconnect" onClick={stop}/>
                }
                <Button text={(webcamStatus ? "Turn off " : "Turn on") + " camera"} onClick={toggleWebcam}/>
                <Button text={(micStatus ? "Turn off " : "Turn on") + " microphone"} onClick={toggleMic}/>
            </div>
            {isActive && <Preview isActive={isActive} videoStream={localMediaStream}/>}
        </>
    )
}

export default ControlBoard;