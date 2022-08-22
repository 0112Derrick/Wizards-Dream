import playerDataInterface from "./PlayerDataInterface.js";
import IcharacterDocument from './PlayerDataInterface.js';

export class Player {
    protected data: playerDataInterface;

    constructor() {
        this.data = {
            username: 'username',
            email: 'email@fakeEmail.com',
            characters: [],
        }
    }
    addCharacter(character: IcharacterDocument) {
        // this.data.characters.push(character);
    }

    getData(this: Player) { return this.data };

    setData(this: Player, playerData: playerDataInterface) {
        Object.assign(this.data, playerData);
    }

}