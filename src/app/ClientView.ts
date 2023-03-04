import { HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import $ClientSyntheticEventEmitter from '../framework/ClientSyntheticEventEmitter.js'
import { EventConstants as $events } from '../constants/EventConstants.js'
import { CharacterCreationDataInterface as $characterSignup } from '../players/PlayerDataInterface.js'
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
        this.DOM[$id.LOGOUT].addEventListener('click', () => { this.logoutAccountCallback() })

        this.DOM[$id.STOP_LOOP].addEventListener('click', () => {
            this.dispatchEventLocal($events.STOP_GAME_LOOP, null);
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

        document.getElementById('character-modal-btn')!.addEventListener('click', () => {

            if (!this.characterMenuStatus) {
                document.querySelector<HTMLElement>(".characterCreateModal")!.style.display = 'block';
                this.characterMenuStatus = true;
            } else {
                document.querySelector<HTMLElement>(".characterCreateModal")!.style.display = 'none';
                this.characterMenuStatus = false;
            }
        })
    }
    createCharacter() {
        //check GenderText

        //check ClassText

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
