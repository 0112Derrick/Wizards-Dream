import { Socket, io } from "socket.io-client";
import { expect } from 'chai';
import { SocketConstants as $socketRoutes } from "../src/constants/ServerConstants.js"

describe('Socket.IO server test', function () {
    //@ts-ignore
    let client1, client2;
    this.timeout(5000);
    beforeEach((done) => {
        client1 = io('http://localhost:8080');
        client2 = io('http://localhost:8080');

        client1.on('connect', () => {
            console.log("connected client1");
            client2.on('connect', () => {
                console.log("connected client2");
                done();
            });
        });
    });

    afterEach((done) => {
        client1.disconnect();
        client2.disconnect();
        done();
    });

    it('should broadcast a message to all clients', (done) => {
        client1.emit($socketRoutes.REQUEST_JOIN_SERVER_ROOM, "01", "us");
        client2.emit($socketRoutes.REQUEST_JOIN_SERVER_ROOM, "02", "us");

        const message = 'Hello, World!';

        client1.emit($socketRoutes.REQUEST_MESSAGE, "us", message, "client1");
        console.log("sending message: ", message);

        client2.on($socketRoutes.RESPONSE_MESSAGE, (message, user) => {
            expect(message).to.equal(message);
            console.log("received message: " + message);
            done();
        });

    });
});