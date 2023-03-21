import { HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import $ClientSyntheticEventEmitter from '../framework/ClientSyntheticEventEmitter.js';
import { EventConstants as $events } from '../constants/EventConstants.js';
import { MapNames } from "../constants/MapNames.js";
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
        this.DOM[$id.SELECT_SERVER].addEventListener('click', () => {
            this.selectServerCallback();
        });
        this.DOM[$id.CLOSE_SERVER_MODAL].addEventListener('click', () => this.closeServerModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.DOM[$id.SERVER_SELECTION_MODAL]) {
                this.closeServerModal();
            }
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
    createButton(data, appendLocation) {
        if (document.getElementById(data.index)) {
            return;
        }
        let button = document.createElement("button");
        console.log(data);
        button.setAttribute("type", "button");
        button.innerHTML = `${data.innerHtml}: ${data.name}`;
        button.setAttribute("id", data.id);
        appendLocation.appendChild(button);
    }
    selectServerCallback() {
        this.DOM[$id.SERVER_SELECTION_MODAL].style.display = 'block';
        this.dispatchEventLocal($events.REQUEST_SERVER_ROOMS, null);
    }
    closeServerModal() {
        this.DOM[$id.SERVER_SELECTION_MODAL].style.display = 'none';
    }
    createServerSelectionButtons(serverRooms) {
        serverRooms.forEach((serverRoom) => {
            let serverRoomData = {
                name: serverRoom.at(0),
                id: serverRoom.at(0),
                innerHtml: "Server",
            };
            this.createButton(serverRoomData, this.DOM[$id.SERVER_SELECTION_BUTTONS_CONTAINER]);
        });
        this.serverButtons(serverRooms);
    }
    serverButtons(serverRooms) {
        serverRooms.forEach((serverRoom) => {
            document.getElementById(serverRoom.at(0)).addEventListener('click', () => {
                this.dispatchEventLocal($events.SELECT_SERVER, serverRoom.at(1));
            });
        });
    }
    async createCharacterSelectionButtons(characters) {
        characters.forEach((character, i) => {
            let data = {
                name: character.username,
                index: i,
            };
            this.createCharacterSelectButton(data);
        });
        this.characterButtons(characters.length);
    }
    characterButtons(numOfCharacter) {
        let button;
        for (let i = 0; i < numOfCharacter; i++) {
            document.getElementById("character+" + i).addEventListener("click", () => {
                button = i;
                this.dispatchEventLocal($events.SELECT_CHARACTER, button);
            });
        }
    }
    createCharacterSelectButton(data) {
        if (document.getElementById(data.index)) {
            return;
        }
        let button = document.createElement("button");
        console.log(data);
        button.setAttribute("type", "button");
        button.innerHTML = "Char: " + data.name;
        button.setAttribute("id", "character+" + data.index);
        document.getElementById(this.DOM[$id.SELECT_CHARACTERS].appendChild(button));
    }
    clearButtons() {
        let button1 = document.getElementById("character+0");
        let button2 = document.getElementById("character+1");
        button1.remove();
        button2.remove();
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
            location: MapNames.GrassyField,
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