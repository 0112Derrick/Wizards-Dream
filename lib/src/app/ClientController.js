import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events } from '../constants/EventConstants.js';
import io from '../../node_modules/socket.io-client';
const socket = io();
class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
    }
    playerJoinedServer(data) {
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