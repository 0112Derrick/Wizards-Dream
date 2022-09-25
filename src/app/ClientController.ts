<<<<<<< HEAD
// import { View as $MainAppView } from "./ClientView.js";
// import $OBSERVER from "../framework/Observer.js";
// import NetworkProxy from "../network/NetworkProxy.js";
// import $HTMLNetwork from "../network/HTML-Proxy.js";
// import { EventConstants as $events } from '../constants/EventConstants.js';
// import { StatusConstants as $StatusConstants } from "../constants//StatusConstants.js";
// import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
// import { StatusConstants as $StatusConstants } from "../constants/StatusConstants.js";
// import { io, Socket } from "/socket.io-client/dist/socket.io.esm.min.js";
// import { appendFile } from "fs";
// import { use } from "passport";


// import io from '../../node_modules/socket.io-client';



// class ClientController extends $OBSERVER {
//     private view = $MainAppView;
//     private networkProxy: NetworkProxy;
//     private socket: SocketIOClient.Socket;
//     constructor(networkProxy: NetworkProxy) {
//         super();
//         this.networkProxy = networkProxy;
//         this.socket = io();
//         this.listenForEvent($events.LOGOUT, (e) => {
//             this.playerLogout();
//         }, this.view);
//         // socket.emit('playerJoinedServer', this.playerJoinedServer);
//     }

//     connect(id, username) {
//         this.socketId = id;
//         console.log(`User: ${this.socketId} / ${username} is online.`)
//     }

//     disconnect() {
//         console.log(`User: ${this.socketId} is offline.`)
//     }


//     playerJoinedServer(data) {

//     }

//     async playerLogout() {
//         let response = await this.networkProxy.postJSON('/player/logout', null);
//         if (response.ok) {
//             console.log("Logged out");
//         } else {
//             console.log('error');
//         }
//     }

// }
// const clientController = new ClientController(new $HTMLNetwork());

=======
import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants/StatusConstants.js";
import { io, Socket } from "/socket.io-client/dist/socket.io.esm.min.js";
import { appendFile } from "fs";





interface ClientToServerEvents {
    playerJoinedServer: (data:number) => void;
    basicEmit: (a: number, b: string, c: number[]) => void;
  }
  
interface ServerToClientEvents {
    withAck: (d: string, cb: (e: number) => void) => void;
  }
  
class ClientController extends $OBSERVER {
    private view = $MainAppView;
    private networkProxy: NetworkProxy;
    private socket: any;
    private socketId: string | null;

    constructor(networkProxy: NetworkProxy) {
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

        //this.socket.on('playerJoinServer', this.playerJoinServer);
        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.socket.id,
                serverRoom: $servers.ROOM1
            }
            this.socket.emit('playerJoinServer', data);
        })
    }

    testConnection(id) {
        console.log('connected ' + id);
    }

    connect(id) {
        this.socketId = id;
        console.log(`User: ${this.socketId} is online.`)
    }

    disconnect() {
        console.log(`User: ${this.socketId} is offline.`)
    }


    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }

    async playerLogout() {
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
        } else {
            console.log('error');
        }
    }

}
const clientController = new ClientController(new $HTMLNetwork());
>>>>>>> multiplayer
