# phony
A phone-like app showcasing real-time communication through WebRTC

<div style="margin: 0 auto">
    <img src="./front-end/src/assets/logo-phony.png" alt="logo-phony" width="500px">
</div>

phony provides peer-to-peer, encrypted, anonymous communication between a reasonable number of users (recommended under 10, due to direct p2p topology)

The first version was implemented as a support for the [WebRTC: start here](https://www.youtube.com/watch?v=dwVxXmYvwdc) talk

The talk was adapted later on into [an article](https://blog.axbg.space/blog/06-webrtc-start-here) that you can check to understand better how the application works (and what you need to do if p2p connection is not possible)

#
### Installation
- Install dependencies
    ```bash
    cd phony
    npm install
    ```

- Run the app
    - 1. Development
        ```bash
        cd phony/front-end
        npm run dev
        ```
        ```bash
        cd phony/back-end
        npm run dev
        ```

    - 2. Production
        ```bash
        cd phony
        npm run prod
        ```

#
### Notes on p2p connections
- The app uses, by default, the STUN protocol to determine if a peer-to-peer connection is possible
    - The default STUN server is provided by Google at the address: `stun.l.google.com:19302`
    - You can test your STUN connectivity [here](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

- Depending on the NAT type of the users, a TURN server might be needed to relay traffic
    - Learn more about NAT types and find out what type your network has [here](https://www.checkmynat.com/)

- Because TURN servers are used to relay traffic actively, they are usually not available for free, so you might need to deploy one yourself
    - Learn how to deploy a TURN server using coturn [here](https://gabrieltanner.org/blog/turn-server/)
    - I created a basic config for coturn, inspired by the article referenced above, [here](https://gist.github.com/axbg/c947f838387998d81664036a7beb3c27)
