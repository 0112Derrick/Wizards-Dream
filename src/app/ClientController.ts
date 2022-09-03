import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js"
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants//StatusConstants.js";

class ClientController extends $OBSERVER {
    private view = $MainAppView;
    private networkProxy: NetworkProxy;

    constructor(networkProxy: NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
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

