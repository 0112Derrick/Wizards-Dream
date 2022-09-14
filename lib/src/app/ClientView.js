import { HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import $ClientSyntheticEventEmitter from '../framework/ClientSyntheticEventEmitter.js';
import { EventConstants as $events } from '../constants/EventConstants.js';
class MissingElementError extends Error {
    constructor(message) {
        super(message);
        this.name = 'Missing Html Element';
    }
}
class ClientView extends $ClientSyntheticEventEmitter {
    DOM = [];
    constructor() {
        super();
        for (let elem_id in $id) {
            let elem = document.getElementById($id[elem_id]);
            if (elem) {
                this.DOM[$id[elem_id]] = elem;
            }
            else {
                throw new MissingElementError(`Element id: ${$id}: ${$id[elem_id]} .`);
            }
        }
        this.DOM[$id.LOGOUT].addEventListener('click', () => { this.logoutAccountCallback(); });
        document.getElementById('logout').addEventListener('click', () => { this.logoutAccountCallback(); });
        const characterCreate = document.getElementById('characterScreen-CreateCharacterBtn');
        characterCreate?.addEventListener('click', () => { this.createCharacter(); });
    }
    createCharacter() {
    }
    logoutAccountCallback() {
        this.dispatchEventLocal($events.LOGOUT, null);
    }
}
export let View = new ClientView();
//# sourceMappingURL=ClientView.js.map