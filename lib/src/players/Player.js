import { MapNames } from "../constants/MapNames.js";
import { CharacterSize as $CharacterSize, CharacterVelocity as $CharacterVelocity } from "../constants/CharacterAttributesConstants.js";
export class Player {
    data;
    static emailRegEx = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    eventEmitter;
    callback;
    target;
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
                        Atk: 0,
                        Matk: 0,
                        Vit: 0,
                        Men: 0,
                        Dex: 0,
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
        };
        this.eventEmitter = null;
        this.callback = null;
    }
    initEmitter(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    addCharacter(character) {
        this.data.characters.push(character);
    }
    getData() { return this.data; }
    ;
    setData(playerData) {
        Object.assign(this.data, playerData);
    }
    async storePlayer(playerData, dispatchEvent = false) {
        this.data = Object.assign(this.data, playerData);
    }
    validateEmail(email) {
        if (email && Player.emailRegEx.test(email)) {
            return true;
        }
        else {
            return false;
        }
    }
    setCallback(callback, target) {
        this.callback = callback;
        this.target = target;
    }
    async fetchPlayerInfo(c) {
        let data = null;
        if (this.callback) {
            data = await c();
        }
        return data;
    }
}
export default new Player();
//# sourceMappingURL=Player.js.map