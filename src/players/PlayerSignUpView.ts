import SyntheticEventEmitter from "../framework/SyntheticEventEmitter.js";
import { LANDING_HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import { playerSignupDataInterface as $playerSignupDataInterface } from "./PlayerDataInterface.js"
import { EventConstants as $event } from "../constants/EventConstants.js";
import $ClientSyntheticEventEmitter from "../framework/ClientSyntheticEventEmitter.js";

class MissingElementError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "Missing HTML Element";
    }
}

/**
 * @class PlayerSignUpView
<<<<<<< HEAD
 * 
 * @extends SyntheticEventEmitter
 * 
 * @description
 * Handles everything related to displaying and emetting onscreen interactions in the form of events
 * 
 * 
=======
 *
 * @extends SyntheticEventEmitter
 *
 * @description
 * Handles everything related to displaying and emetting onscreen interactions in the form of events
 *
 *
>>>>>>> multiplayer
 */

class PlayerSignUpView extends $ClientSyntheticEventEmitter {

    private DOM: HTMLElement[] = [];


    constructor() {
        super();

        // Create HTML element objects using the values from the IDs file and
        // store them in an array for later use.
        for (let elem_id in $id) {
            let elem = document.getElementById($id[elem_id]);
            if (elem) {
                this.DOM[$id[elem_id]] = elem
            } else {
                throw new MissingElementError(`Element id ${elem_id}: ${$id[elem_id]} not found`);
            }
        }

        this.DOM[$id.LOGIN_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.playerLoginFormSubmitCallback();
        })

        this.DOM[$id.SIGNUP_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.playerSubmitFormCallback();
        });



    }

    updateView() { }

    playerSubmitFormCallback() {

        let formData: $playerSignupDataInterface = {
            username: (<HTMLInputElement>this.DOM[$id.SIGNUP_USERNAME]).value,
            email: (<HTMLInputElement>this.DOM[$id.SIGNUP_EMAIL_INPUT]).value.toLowerCase(),
            password: (<HTMLInputElement>this.DOM[$id.SIGNUP_PASSWORD_INPUT]).value,
        }

        console.log("Got new player account submission", formData);

        if (formData.email && formData.password && formData.username) {
            console.log('Submitting player signup form', formData);
            this.dispatchEventLocal($event.SIGN_UP, formData);

        } else {
            alert("Please fill out all information correctly");
            this.resetSignupForm();
        }
    }
    //}

    removeHash() {
        history.replaceState('', document.title, window.location.origin + window.location.pathname + window.location.search)
    };

    resetSignupForm() {
        <HTMLFormElement>this.DOM[$id.SIGNUP_FORM].reset();
    };

    resetLoginForm() {
        <HTMLFormElement>this.DOM[$id.LOGIN_FORM].reset();
    };

    playerLoginFormSubmitCallback() {

        console.log("Sending log in info to controller");
        //(<HTMLFormElement>this.DOM[$id.LOGIN_FORM])
        const formData = new FormData((<HTMLFormElement>this.DOM[$id.LOGIN_FORM]));

        formData.append('email', (<HTMLInputElement>this.DOM[$id.LOGIN_EMAIL_INPUT]).value);
        formData.append('password', (<HTMLInputElement>this.DOM[$id.LOGIN_PASSWORD_INPUT]).value);

        //{ email: (<HTMLInputElement>this.emailLogin).value, password: (<HTMLInputElement>this.passwordLogin).value }
        const [[, email], [, password]] = Array.from(formData.entries());
        let formDataPlayer = {
            email: email,
            password: password,
        }

        if (email && password) {
            this.dispatchEventLocal($event.SIGN_IN, formDataPlayer);
        }
    };

}

let playerSignupView = new PlayerSignUpView();
<<<<<<< HEAD
export default playerSignupView;
=======
export default playerSignupView;
>>>>>>> multiplayer
