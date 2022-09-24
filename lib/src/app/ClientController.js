import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { io } from "/socket.io-client/dist/socket.io.esm.min.js";
class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    socket;
    socketId;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        this.socket = io();
        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("online", this.connect);
        this.socket.on("offline", this.disconnect);
        this.socket.emit('connection');
        this.socketId = '';
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.socket.id,
                serverRoom: $servers.ROOM1
            };
            this.socket.emit('playerJoinServer', data);
        });
    }
    testConnection(id) {
        console.log('connected ' + id);
    }
    connect(id) {
        this.socketId = id;
        console.log(`User: ${this.socketId} is online.`);
    }
    disconnect() {
        console.log(`User: ${this.socketId} is offline.`);
    }
    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }
    async playerLogout() {
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
        }
        else {
            console.log('error');
        }
    }
}
const clientController = new ClientController(new $HTMLNetwork());
//# sourceMappingURL=ClientController.js.map