import { HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import $ClientSyntheticEventEmitter from '../framework/ClientSyntheticEventEmitter.js'
import { EventConstants as $events } from '../constants/EventConstants.js'
import { CharacterCreationDataInterface as $characterSignup } from '../players/interfaces/PlayerDataInterface.js'
import { resolve } from "path";
import { MapNames } from "../constants/MapNames.js";
class MissingElementError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Missing Html Element'
    }
}

class ClientView extends $ClientSyntheticEventEmitter {

    private DOM: HTMLElement[] = [];
    private characterMenuStatus = false;


    constructor() {
        super();
        for (let elem_id in $id) {
            let elem = document.getElementById($id[elem_id]);
            if (elem) {
                this.DOM[$id[elem_id]] = elem;
            } else {
                throw new MissingElementError(`Element id: ${$id}: ${$id[elem_id]} .`);
            }
        }
        this.DOM[$id.LOGOUT].addEventListener('click', () => { this.logoutAccountCallback() });

        this.DOM[$id.STOP_LOOP].addEventListener('click', () => {
            this.dispatchEventLocal($events.STOP_GAME_LOOP, null);
        });

        this.DOM[$id.SELECT_SERVER].addEventListener('click', () => {
            this.selectServerCallback();
        })

        this.DOM[$id.CLOSE_SERVER_MODAL].addEventListener('click', () => this.closeServerModal());

        window.addEventListener('click', (e) => {
            if (e.target === this.DOM[$id.SERVER_SELECTION_MODAL]) {
                this.closeServerModal();
            }
        })

        this.DOM[$id.GAME_CHAT_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.sendMessage();
        })

        this.DOM[$id.START_LOOP].addEventListener('click', () => {
            this.dispatchEventLocal($events.START_GAME_LOOP, null);
        })
        this.DOM[$id.CHARACTER_CREATE_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.characterCreateCallback();
        });

        document.getElementById('logout')!.addEventListener('click', () => { this.logoutAccountCallback() });


        //document.getElementById(this.DOM[$id.CHARACTER_MODAL_BTN]).addEventListener('click', () => {
        this.DOM[$id.CHARACTER_MODAL_BTN].addEventListener('click', () => {
            if (!this.characterMenuStatus) {
                // document.querySelector<HTMLElement>(this.DOM[$id.CHARACTER_MODAL_BTN])!.style.display = 'block';
                this.DOM[$id.CHARACTER_CREATE_MODAL]!.style.display = 'block';
                this.characterMenuStatus = true;
            } else {
                this.DOM[$id.CHARACTER_CREATE_MODAL]!.style.display = 'none';
                // document.querySelector<HTMLElement>(this.DOM[$id.CHARACTER_MODAL_BTN])!.style.display = 'none';
                this.characterMenuStatus = false;
            }
        })
    }


    //createButton takes in an object with the attributes name, id, innerHtml / & html element to append to.
    createButton(data, appendLocation): void {
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

    createServerSelectionButtons(serverRooms: Array<string>) {
        serverRooms.forEach((serverRoom) => {
            let serverRoomData = {
                name: serverRoom.at(0),
                id: serverRoom.at(0),
                innerHtml: "Server",
            }

            this.createButton(serverRoomData, this.DOM[$id.SERVER_SELECTION_BUTTONS_CONTAINER]);
        })
        /* for (let serverRoom of serverRooms) {
        } */
        this.serverButtons(serverRooms);
    }

    serverButtons(serverRooms: Array<string>) {
        serverRooms.forEach((serverRoom) => {
            document.getElementById(serverRoom.at(0)).addEventListener('click', () => {
                this.dispatchEventLocal($events.SELECT_SERVER, serverRoom.at(1));
            });
        })
        /* for (let serverRoom of serverRooms) {
      } */
    }

    async createCharacterSelectionButtons(characters: Array<any>) {

        characters.forEach((character, i) => {
            let data = {
                name: character.username,
                index: i,
            }
            this.createCharacterSelectButton(data);
        });
        this.characterButtons(characters.length);
    }

    characterButtons(numOfCharacter: number) {
        let button: number;
        for (let i = 0; i < numOfCharacter; i++) {
            document.getElementById("character+" + i).addEventListener("click", () => {
                button = i;
                this.dispatchEventLocal($events.SELECT_CHARACTER, button);
            })
        }
        /* document.getElementById("character+0").addEventListener("click", () => {
            button = 0;
            this.dispatchEventLocal($events.SELECT_CHARACTER, button);
        })

        document.getElementById("character+1").addEventListener("click", () => {
            button = 1;
            this.dispatchEventLocal($events.SELECT_CHARACTER, button);
        }) */
    }


    createCharacterSelectButton(data): void {
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

    clearButtons(): void {
        let button1 = document.getElementById("character+0");
        let button2 = document.getElementById("character+1");

        button1.remove();
        button2.remove();
    }

    sendMessage() {
        let message: string = (<HTMLInputElement>this.DOM[$id.GAME_CHAT_INPUT]).value;
        this.dispatchEventLocal($events.MESSAGE, message);
        this.resetMessageForm();
    }

    postMessage(message, username) {
        let li: HTMLLIElement = document.createElement('li');
        li.innerHTML = username + ": " + message;
        <HTMLUListElement>this.DOM[$id.GAME_CHAT_UL].appendChild(li);
        this.updateScroll(this.DOM[$id.GAME_CHAT_UL]);
    }

    updateScroll(chat) {
        chat.scrollTop = chat.scrollHeight;
    }

    resetMessageForm() {
        <HTMLFormElement>this.DOM[$id.GAME_CHAT_FORM].reset();
    }

    characterCreateCallback() {

        let formData: $characterSignup = {
            username: (<HTMLInputElement>this.DOM[$id.CHARACTER_NAME]).value,
            characterGender: (<HTMLInputElement>document.querySelector('input[name="character-gender"]:checked')).value,
            player: "",
            x: 0,
            y: 0,
            sprite: undefined,
            direction: "right",
            width: 32,
            height: 32,
            location: MapNames.GrassyField,
        }

        console.log("Got new player account submission", formData);

        if (formData.username) {
            console.log('Submitting character creation form', formData);
            this.dispatchEventLocal($events.CHARACTER_CREATE, formData);

        } else {
            alert("Please fill out all information correctly");
            this.resetSignupForm();
        }
    }

    resetSignupForm() {
        <HTMLFormElement>this.DOM[$id.CHARACTER_CREATE_FORM].reset();
    };

    logoutAccountCallback() {
        this.dispatchEventLocal($events.LOGOUT, null);
    }


}
export let View = new ClientView();
