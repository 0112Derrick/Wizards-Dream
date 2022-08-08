import { View, ClientView } from "./ClientView.js";
export class ClientController {
    controller: ClientController | null = null;
    view: ClientView | null = null;

    constructor(view) {
        if (this.controller == null || this.controller == undefined) {
            this.controller = new ClientController(View);
            this.view = View;
        } else {
            return this.controller;
        }
    }
    handleSignupCallback(data) {

    }


}

