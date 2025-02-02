import {useEffect, useRef} from "react";

const Preview = (props) => {
    const refVideo = useRef(null);

    useEffect(() => {
        if (refVideo.current) {
            refVideo.current.srcObject = props.videoStream;
        }
    }, [props.videoStream]);

    return (
        <>
            <div className={"fixed bottom-5 right-5 cursor-grab active:cursor-grabbing"}>
                <div style={{width: "200px"}}>
                    <video ref={refVideo} className={"w-full"} playsInline autoPlay muted>
                    </video>
                    <div className="absolute right-1 bottom-0">
                        <p className="text-white font-semibold drop-shadow-lg">
                            webcam preview
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Preview;