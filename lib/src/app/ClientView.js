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
    characterMenuStatus = false;
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
        this.DOM[$id.STOP_LOOP].addEventListener('click', () => {
            this.dispatchEventLocal($events.STOP_GAME_LOOP, null);
        });
        this.DOM[$id.GAME_CHAT_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.sendMessage();
        });
        this.DOM[$id.START_LOOP].addEventListener('click', () => {
            this.dispatchEventLocal($events.START_GAME_LOOP, null);
        });
        this.DOM[$id.CHARACTER_CREATE_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.characterCreateCallback();
        });
        document.getElementById('logout').addEventListener('click', () => { this.logoutAccountCallback(); });
        this.DOM[$id.CHARACTER_MODAL_BTN].addEventListener('click', () => {
            if (!this.characterMenuStatus) {
                this.DOM[$id.CHARACTER_CREATE_MODAL].style.display = 'block';
                this.characterMenuStatus = true;
            }
            else {
                this.DOM[$id.CHARACTER_CREATE_MODAL].style.display = 'none';
                this.characterMenuStatus = false;
            }
        });
    }
    async createCharacterSelectionButtons(characters) {
        characters.forEach((character, i) => {
            let data = {
                name: character.username,
                index: i,
            };
            this.createButton(data);
        });
        this.characterButtons();
    }
    characterButtons() {
        let button;
        document.getElementById("character+0").addEventListener("click", () => {
            button = 0;
            this.dispatchEventLocal($events.SELECT_CHARACTER, button);
        });
        document.getElementById("character+1").addEventListener("click", () => {
            button = 1;
            this.dispatchEventLocal($events.SELECT_CHARACTER, button);
        });
    }
    createButton(data) {
        let button = document.createElement("button");
        console.log(data);
        button.setAttribute("type", "button");
        button.innerHTML = "Char: " + data.name;
        button.setAttribute("id", "character+" + data.index);
        document.getElementById(this.DOM[$id.SELECT_CHARACTERS].appendChild(button));
    }
    sendMessage() {
        let message = this.DOM[$id.GAME_CHAT_INPUT].value;
        this.dispatchEventLocal($events.MESSAGE, message);
        this.resetMessageForm();
    }
    postMessage(message, username) {
        let li = document.createElement('li');
        li.innerHTML = username + ": " + message;
        this.DOM[$id.GAME_CHAT_UL].appendChild(li);
        this.updateScroll(this.DOM[$id.GAME_CHAT_UL]);
    }
    updateScroll(chat) {
        chat.scrollTop = chat.scrollHeight;
    }
    resetMessageForm() {
        this.DOM[$id.GAME_CHAT_FORM].reset();
    }
    characterCreateCallback() {
        let formData = {
            username: this.DOM[$id.CHARACTER_NAME].value,
            characterGender: document.querySelector('input[name="character-gender"]:checked').value,
            player: "",
            x: 0,
            y: 0,
            sprite: undefined,
            direction: "right",
            width: 32,
            height: 32,
        };
        console.log("Got new player account submission", formData);
        if (formData.username) {
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