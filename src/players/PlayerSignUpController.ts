import $Observer from '../framework/Observer.js';
import $ClientSyntheticEventEmitter from '../framework/ClientSyntheticEventEmitter.js';
import $playerSignupView from './PlayerSignUpView.js';
import { EventConstants as $events } from '../constants/EventConstants.js'
import { StatusConstants as $statusConstants } from '../constants/StatusConstants.js'
import $NetworkProxy from '../network/NetworkProxy.js';
import $HTMLProxy from '../network/HTML-Proxy.js';
import { response } from 'express';
import { playerSignupDataInterface as $playerSignupDataInterface } from '../players/PlayerDataInterface.js'
import $Player from './Player.js';
import NetworkProxy from '../network/NetworkProxy.js';

class PlayerSignUpController extends $Observer {
    private networkProxy: $NetworkProxy;
    private view = $playerSignupView;

    constructor(networkProxy: $NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        const PLAYERSAVEROUTE = '/player/signup';
        const PLAYERLOGINROUTE = '/player/login';
        $Player.initEmitter(new $ClientSyntheticEventEmitter);

        this.listenForEvent($events.SIGN_UP, (e) => { this.savePlayerSignUpInfoCallback(PLAYERSAVEROUTE, e); }, this.view);
        this.listenForEvent($events.SIGN_IN, (e) => { this.playerLogIn(PLAYERLOGINROUTE, e) }, this.view)
    }

    /**
     * @description
     * Callback triggered by the View playerSignUp event.
     * Create a new Player Model using the sign up info
     * 
     * @param {CustomEvent} event - Custom event object which includes player's details 
     * 
     */
    async savePlayerSignUpInfoCallback(route: string, data: any): Promise<boolean> {
        try {
            console.log('Sending data to server');
            let playerData: $playerSignupDataInterface =
            {
                username: '',
                email: '',
                password: ''
            }
            console.log(data.detail);
            playerData = Object.assign(playerData, data.detail);

            let response = await this.networkProxy.postJSON(route, playerData);

            if ($Player.validateEmail(playerData.email)) {

                if (response && response.ok) {
                    $playerSignupView.resetSignupForm();
                    // window.location.assign('/');
                    return Promise.resolve(true);
                }

                else {
                    console.log("Something went wrong writing player, status: ", response?.status);
                    return Promise.reject(false);
                }
            }

            else {
                console.log('Invalid email');
                return Promise.reject(false);
            }

        }
        catch (e) {
            console.log("Something went wrong writing player", e)
            return Promise.reject(false);
        }

    }

    async playerLogIn(route: string, event) {
        const entries = event.detail.entries();

        //const [[, email], [, password]] = Array.from(entries); //Use array destructuring to extract data from form.
        const email = entries.email;
        const password = entries.password;
        const result = await this.networkProxy.postJSON(route, { email: email, password: password })

        //Log the user in or report the appropriate error message.
        console.log('result: ', result);

        if (result.status == $statusConstants.OK) {
            window.location.assign('/');
        }
        if (result.status == $statusConstants.CLIENT_ERROR_BASE) {
            window.location.assign('/player/landing');

        }
        else if ( result.status < $statusConstants.SERVER_ERROR_BASE) {
            switch (result.status) {
                case $statusConstants.USER_NOT_FOUND:
                    alert('User not found');
                    break;

                case $statusConstants.INVALID_PASSWORD:
                    alert("Invalid Password");
                    break;
                default:
                    alert("Unknown Client error");
            }
        }
        else {
            alert('Oops unknown server error.');
        }
    }

    notify(data: any): void {
        super.notify(data);
        this.view.updateView();
    }

}

const playerSignUpController = new PlayerSignUpController(new $HTMLProxy());