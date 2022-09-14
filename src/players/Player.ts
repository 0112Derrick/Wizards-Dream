import $playerDataInterface from "./PlayerDataInterface.js";
import IcharacterDocument from './PlayerDataInterface.js';
import $SyntheticEventEmitter from '../framework/SyntheticEventEmitter.js';
import { EventConstants as $EventConstants } from '../constants/EventConstants.js';

export class Player {

    protected data: $playerDataInterface;
    static emailRegEx = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    protected eventEmitter: ($SyntheticEventEmitter | null)
    private callback: (Function | null)
    target: any;

    constructor() {
        this.data = {
            username: 'username',
            email: 'email@fakeEmail.com',
            characters: [],
        }
        this.eventEmitter = null;
        this.callback = null;
    }

    initEmitter(eventEmitter: $SyntheticEventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    addCharacter(character: IcharacterDocument) {
        //   this.data.characters.push(character);
    }

    getData(this: Player) { return this.data };

    setData(this: Player, playerData: $playerDataInterface) {
        Object.assign(this.data, playerData);
    }

    async storePlayer(playerData: $playerDataInterface, dispatchEvent: boolean = false) {
        this.data = Object.assign(this.data, playerData);
        // Push contact onto the server and save the contact to the db
        //Implement

    }

    // async fetchPlayer(): Promise<$playerDataInterface> {
    //     //Fetch this player from the db and store in the model
    //     let data: $playerDataInterface | null = await this.fetchPlayerInfo();
    //     let playerData: $playerDataInterface;
    //     if (data) {
    //         playerData = data;

    //         //db fetch call
    //         if (playerData) {
    //             this.data = Object.assign(this.data, playerData);
    //         }

    //         return Promise.resolve(playerData);
    //     }
    // }


    validateEmail(email: string) {
        if (email && Player.emailRegEx.test(email)) {
            return true;
        } else {
            return false;
        }
    }

    public setCallback(callback, target) {
        this.callback = callback;
        this.target = target;
    }

    async fetchPlayerInfo<$playerDataInterface>(c) {
        let data: $playerDataInterface | null = null;
        if (this.callback) {
            data = await c();
        }
        return data;
    }
}

export default new Player();


