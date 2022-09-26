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
        this.DOM[$id.CHARACTER_CREATE_FORM].addEventListener('submit', () => { this.characterCreateCallback(); });
        document.getElementById('logout').addEventListener('click', () => { this.logoutAccountCallback(); });
    }
    createCharacter() {
    }
    characterCreateCallback() {
        let formData = {
            name: this.DOM[$id.CHARACTER_NAME].value,
        };
        console.log("Got new player account submission", formData);
        if (formData.name) {
            console.log('Submitting character creation form', formData);
            this.dispatchEventLocal($events.CHARACTER_CREATE, formData);
        }
        else {
            alert("Please fill out all information correctly");
            this.resetSignupForm();
        }
    }
    resetSignupForm() {
        this.DOM[$id.CHARACTER_CREATE_FORM].reset();
    }
    ;
    logoutAccountCallback() {
        this.dispatchEventLocal($events.LOGOUT, null);
    }
}
export let View = new ClientView();
//# sourceMappingURL=ClientView.js.map