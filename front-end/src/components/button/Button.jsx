const Button = (props) => {
    return (
        <button type="button"
                className="block w-64 text-white bg-webrtc-main-color rounded-lg hover:bg-white hover:text-webrtc-main-color
                transition-colors duration-200 shadow-md border border-webrtc-main-color disabled:opacity-50
                disabled:cursor-not-allowed"
                onClick={props.onClick} disabled={props.disabled}>
            <div className="block w-full h-full px-6 py-3">{props.text}</div>
        </button>
    )
}

export default Button