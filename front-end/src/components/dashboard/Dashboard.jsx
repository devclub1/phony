import Button from "../button/Button"
import logoWeb from "../../assets/logo-phony.png";
import {useState} from "react";
import {useNavigate} from "react-router";
import {signalingServer} from "../../data/defaults.js";

const Dashboard = () => {
    const [room, setRoom] = useState("");
    const navigate = useNavigate();

    const createRoom = () => {
        fetch(signalingServer + "/api/generate-token")
            .then(res => res.json())
            .then(data => {
                navigate(`/room/${data.token}`);
            })
    }

    const joinRoom = () => {
        navigate(`/room/${room}`);
    }

    return (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/3">
            <div className="flex flex-col items-center justify-center">
                <img className="mb-8 w-80" src={logoWeb} alt="logo web"></img>
                <div className="space-y-4">
                    <Button text="start a room" onClick={createRoom}/>
                    <br/> <br/>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring focus:ring-webrtc-main-color"
                        placeholder="room name" value={room} onChange={(e) => setRoom(e.target.value)}
                        />
                    <Button text="join a room" onClick={joinRoom} disabled={room === ""}/>
                </div>
            </div>
        </div>
    )
}

export default Dashboard