import $Observer from '../framework/Observer.js';
import $ClientSyntheticEventEmitter from '../framework/ClientSyntheticEventEmitter.js';
import $playerSignupView from './PlayerSignUpView.js';
import { EventConstants as $events } from '../constants/EventConstants.js';
import { StatusConstants as $statusConstants } from '../constants/StatusConstants.js';
import $HTMLProxy from '../network/HTML-Proxy.js';
import $Player from './Player.js';
class PlayerSignUpController extends $Observer {
    networkProxy;
    view = $playerSignupView;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const PLAYERSAVEROUTE = '/player/signup';
        const PLAYERLOGINROUTE = '/player/login';
        $Player.initEmitter(new $ClientSyntheticEventEmitter);
        this.listenForEvent($events.SIGN_UP, (e) => { this.savePlayerSignUpInfoCallback(PLAYERSAVEROUTE, e); }, this.view);
        this.listenForEvent($events.SIGN_IN, (e) => { this.playerLogIn(PLAYERLOGINROUTE, e); }, this.view);
    }
    async savePlayerSignUpInfoCallback(route, data) {
        try {
            console.log('Sending data to server');
            let playerData = {
                username: '',
                email: '',
                password: ''
            };
            console.log(data.detail);
            playerData = Object.assign(playerData, data.detail);
            let response = await this.networkProxy.postJSON(route, playerData);
            if ($Player.validateEmail(playerData.email)) {
                if (response && response.ok) {
                    $playerSignupView.resetSignupForm();
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
            console.log("Something went wrong writing player", e);
            return Promise.reject(false);
        }
    }
    async playerLogIn(route, event) {
        const email = event.detail.email;
        const password = event.detail.password;
        const result = await this.networkProxy.postJSON(route, { email: email, password: password });
        console.log('result: ', result);
        if (result.status == $statusConstants.OK) {
            window.location.assign('/');
        }
        if (result.status == $statusConstants.CLIENT_ERROR_BASE) {
            window.location.assign('/player/landing');
        }
        else if (result.status < $statusConstants.SERVER_ERROR_BASE) {
            switch (result.status) {
                case $statusConstants.USER_NOT_FOUND:
                    alert('User not found');
                    break;
                case $statusConstants.INVALID_PASSWORD:
                    alert("Invalid Password");
                    break;
                case $statusConstants.OK:
                    alert("Logging in");
                    break;
                default:
                    alert("Unknown Client error");
            }
        }
        else {
            alert('Oops unknown server error.');
        }
    }
    notify(data) {
        super.notify(data);
        this.view.updateView();
    }
}
const playerSignUpController = new PlayerSignUpController(new $HTMLProxy());
//# sourceMappingURL=PlayerSignUpController.js.map