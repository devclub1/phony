export default class MediaStreamManager {
    #localStreamCapture = null;
    get localStreamCapture() {
        return this.#localStreamCapture;
    }

    async captureLocalStream() {
        try {
            this.#localStreamCapture = await navigator.mediaDevices.getUserMedia({ video: true, audio: true});
        } catch (err) {
            console.error(`Error: ${err}`);
        }
    }

    async stopLocalStreamCapture() {
        if (this.#localStreamCapture) {
            this.#localStreamCapture.getTracks().forEach(track => track.stop());
            this.#localStreamCapture = null;
        }
    }

    toggleWebcam() {
        if (this.#localStreamCapture && this.#localStreamCapture.getVideoTracks().length > 0) {
            const newStatus = !this.#localStreamCapture.getVideoTracks()[0].enabled;
            this.#localStreamCapture.getVideoTracks()[0].enabled = newStatus;

            return newStatus;
        }
    }

    toggleMicrophone() {
        if (this.#localStreamCapture && this.#localStreamCapture.getAudioTracks().length > 0) {
            const newStatus = !this.#localStreamCapture.getAudioTracks()[0].enabled;
            this.#localStreamCapture.getAudioTracks()[0].enabled = newStatus;

            return newStatus;
        }
    }
}