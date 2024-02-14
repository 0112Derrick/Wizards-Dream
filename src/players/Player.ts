import $playerDataInterface, { characterDataInterface } from "./interfaces/CharacterDataInterface.js";
import IcharacterDocument from './interfaces/CharacterDataInterface.js';
import $SyntheticEventEmitter from '../framework/SyntheticEventEmitter.js';
import { EventConstants as $EventConstants } from '../constants/EventConstants.js';
import { MapNames } from "../constants/MapNames.js";
import { CharacterSize as $CharacterSize, CharacterVelocity as $CharacterVelocity } from "../constants/CharacterAttributesConstants.js"

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
                width: $CharacterSize.width,
                height: $CharacterSize.height,
                gameObjectID: 0,
                location: MapNames.GrassyField,
                attributes: {
                    level: 0,
                    experience: 0,
                    experienceCap: 0,
                    statPoints: 0,
                    hp: 0,
                    sp: 0,
                    def: 0,
                    mdef: 0,
                    crit: 0,


                    //stats directly controlled by the player when using levelinh points
                    Atk: 0,
                    Matk: 0,
                    Vit: 0,
                    Men: 0,
                    Dex: 0,
                    hpCap: 0,
                    spCap: 0
                },
                x: 0,
                y: 0,
                friends: [],
                equipment: { head: null, chest: null, legs: null, weapon: null },
                sprite: 'png',
                direction: 'right',
                class: '',
                guild: '',
                unlockedSkills: [],
                xVelocity: $CharacterVelocity.xVelocity,
                yVelocity: $CharacterVelocity.yVelocity,
                name: 'name',
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


