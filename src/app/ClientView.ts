import HTML_IDS from "../constants/HTMLElementIds.js";
import DOMPurify from 'dompurify';

class MissingElementError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'Missing Html Element'
    }
}

export class ClientView {
    view: ClientView | null = null;
    private DOM: HTMLElement[] = [];


    constructor() {
        if (this.view == null) {
            this.view = new ClientView();
        }
        for (let elem_id in HTML_IDS) {
            let elem = document.getElementById(HTML_IDS[elem_id]);
            if (elem) {
                this.DOM[HTML_IDS[elem_id]] = elem;
            } else {
                throw new MissingElementError(`Element id: ${HTML_IDS}: ${HTML_IDS[elem_id]} .`);
            }
        }

        let signupForm = this.DOM[HTML_IDS.SIGNUP_FORM];
        signupForm.addEventListener('submit', (e) => { this.handleSignup(e); })
    }


    handleSignup(event) {
        event.preventDefault();

        const CleanEmail: string = DOMPurify.sanitize(this.DOM[HTML_IDS.SIGNUP_EMAIL_INPUT].value.toLowerCase());
        const UserPassword: string = this.DOM[HTML_IDS.SIGNUP_PASSWORD_INPUT].value;

        let data = {
            userEmail: { CleanEmail },
            userPassword: { UserPassword },
        }

        // handleSignupCallback(data);
        //Encrypt user password
    }
}
export let View = new ClientView();