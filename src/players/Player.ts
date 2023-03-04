import $playerDataInterface, { characterDataInterface } from "./PlayerDataInterface.js";
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
            email: 'email@fakeEmail.com',
            username: 'username',
            characters: [{
                username: 'username',
                characterGender: '',
                player: '',
                width: 32,
                height: 32,
                gameObjectID: 0,
                attributes: {
                    level: 0,
                    experience: 0,
                    experienceCap: 0,
                    statPoints: 0,
                    hp: 0,// Determines how many times a player can take damage before dying & hp regen amount
                    sp: 0, // Determines how many times a magic atk can be used and regen amount
                    def: 0,// Determines how much damage is taken from phyiscal hits
                    mdef: 0,// Determines how much damage is taken from Magic hits
                    crit: 0,// Determines wheter or not a hit does increased damgage & increased damage amount

                    //stats directly controlled by the player when using levelinh points
                    Atk: 0,// Determines Physical atk damage and gives a minor boost to hp total
                    Matk: 0,// Determines Magic atk damage and gives a minor boost to sp total
                    Vit: 0,// Increases hp and def
                    Men: 0,//Increases sp & mdef
                    Dex: 0,//Increases Crit  
                },
                x: 0,
                y: 0,
                friends: [],
                equipment: { head: [], chest: [], legs: [], weapon: [] },
                sprite: undefined,
                direction: 'right',
                class: '',
                guild: '',
                items: [],
            }],
            playerID: '',
        }

        this.eventEmitter = null;
        this.callback = null;
    }

    initEmitter(eventEmitter: $SyntheticEventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    addCharacter(character: characterDataInterface) {
        this.data.characters.push(character);
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


