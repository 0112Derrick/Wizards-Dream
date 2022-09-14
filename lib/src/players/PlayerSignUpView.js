import { LANDING_HTML_IDS as $id } from "../constants/HTMLElementIds.js";
import { EventConstants as $event } from "../constants/EventConstants.js";
import $ClientSyntheticEventEmitter from "../framework/ClientSyntheticEventEmitter.js";
class MissingElementError extends Error {
    constructor(message) {
        super(message);
        this.name = "Missing HTML Element";
    }
}
class PlayerSignUpView extends $ClientSyntheticEventEmitter {
    DOM = [];
    constructor() {
        super();
        for (let elem_id in $id) {
            let elem = document.getElementById($id[elem_id]);
            if (elem) {
                this.DOM[$id[elem_id]] = elem;
            }
            else {
                throw new MissingElementError(`Element id ${elem_id}: ${$id[elem_id]} not found`);
            }
        }
        this.DOM[$id.LOGIN_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.playerLoginFormSubmitCallback();
        });
        this.DOM[$id.SIGNUP_FORM].addEventListener('submit', (event) => {
            event.preventDefault();
            this.playerSubmitFormCallback();
        });
    }
    updateView() { }
    playerSubmitFormCallback() {
        let formData = {
            username: this.DOM[$id.SIGNUP_USERNAME].value,
            email: this.DOM[$id.SIGNUP_EMAIL_INPUT].value.toLowerCase(),
            password: this.DOM[$id.SIGNUP_PASSWORD_INPUT].value,
        };
        console.log("Got new player account submission", formData);
        if (formData.email && formData.password && formData.username) {
            console.log('Submitting player signup form', formData);
            this.dispatchEventLocal($event.SIGN_UP, formData);
        }
        else {
            alert("Please fill out all information correctly");
            this.resetSignupForm();
        }
    }
    removeHash() {
        history.replaceState('', document.title, window.location.origin + window.location.pathname + window.location.search);
    }
    ;
    resetSignupForm() {
        this.DOM[$id.SIGNUP_FORM].reset();
    }
    ;
    resetLoginForm() {
        this.DOM[$id.LOGIN_FORM].reset();
    }
    ;
    playerLoginFormSubmitCallback() {
        console.log("Sending log in info to controller");
        const formData = new FormData(this.DOM[$id.LOGIN_FORM]);
        formData.append('email', this.DOM[$id.LOGIN_EMAIL_INPUT].value);
        formData.append('password', this.DOM[$id.LOGIN_PASSWORD_INPUT].value);
        const [[, email], [, password]] = Array.from(formData.entries());
        let formDataPlayer = {
            email: email,
            password: password,
        };
        if (email && password) {
            this.dispatchEventLocal($event.SIGN_IN, formDataPlayer);
        }
    }
    ;
}
let playerSignupView = new PlayerSignUpView();
export default playerSignupView;
//# sourceMappingURL=PlayerSignUpView.js.map