import { View } from "./ClientView.js";
export class ClientController {
    controller = null;
    view = null;
    constructor(view) {
        if (this.controller == null || this.controller == undefined) {
            this.controller = new ClientController(View);
            this.view = View;
        }
        else {
            return this.controller;
        }
    }
    handleSignupCallback(data) {
    }
}
//# sourceMappingURL=ClientController.js.map