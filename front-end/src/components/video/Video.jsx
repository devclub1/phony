import { useEffect, useRef } from "react";

const Video = (props) => {
  const refVideo = useRef(null);

  useEffect(() => {
    if (refVideo.current) {
      refVideo.current.srcObject = props.videoStream;
    }
  }, [props.videoStream]);

  return (
    <>
      <div className={"relative"}>
        <div className={"overflow-hidden"}>
          <video ref={refVideo} className={"w-full"} playsInline autoPlay controls={props.controls}
            muted={props.preview}>
          </video>
          {props.preview && <div className="absolute right-4 bottom-4">
            <p className="text-white text-2xl font-semibold drop-shadow-lg">
              webcam preview
            </p>
          </div>}
        </div>
      </div>
    </>
  )
}

export default Video;
