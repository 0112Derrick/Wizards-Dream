import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants//StatusConstants.js";

import {io, Socket} from '/socket.io-client/dist/socket.io.esm.min.js';


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
   socket: Socket<ServerToClientEvents, ClientToServerEvents>;
    constructor(networkProxy: NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        this.socket = io();
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
        this.socket.emit('playerJoinedServer',123);
    }

    playerJoinedServer(data) {

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
