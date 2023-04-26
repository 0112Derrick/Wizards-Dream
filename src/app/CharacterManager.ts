import { Character as $Character } from "./Character.js";
import { CharacterVelocity as $CharacterVelocity, CharacterSize as $CharacterSize } from "../constants/CharacterAttributesConstants.js"
import { Sprite } from "./Sprite.js";
import { characterDataInterface as $characterDataInterface } from "../players/interfaces/CharacterDataInterface.js"
import { MapNames as $MapNames } from "../constants/MapNames.js"
import { Utils as $Utils } from "./Utils.js";
import { CharacterCreationDataInterface as $characterSignup } from "../players/interfaces/CharacterDataInterface.js"
import { Direction as $Direction } from "./DirectionInput.js";

export default class CharacterManager {
    private character: $Character = null;
    private listOfCharacters: any[] = null;

    constructor() {

    }

    public get Character(): $Character {
        return this.character;
    }

    public SETCharacter(char: $Character): void {
        this.character = char;
    }

    getListOfCharacters(): any[] {
        return this.listOfCharacters;
    }

    setListOfCharacter(characters: Array<any>) {
        if (Array.isArray(characters)) {
            this.listOfCharacters = characters;
            console.log("Characters array set.");
        }
    }

    selectCharacterByIndex(index: number): any {
        if (index > this.listOfCharacters.length) {
            console.log("Index out of bounds. index:" + index + " character list length: " + this.listOfCharacters.length);
            return;
        }

        return this.listOfCharacters.at(index);
    }

    printActiveCharacter(): void {
        console.log("Character: " + this.character.toJSON());
    }


    createCharacterFromCharacterDataI(character: $characterDataInterface): $Character {
        if (character.y >= 400) {
            character.y = 100;
        }

        let createdCharacter = new $Character({
            isPlayerControlled: false,
            x: character.x,
            y: character.y,
            name: character.name || character.username,
            xVelocity: $CharacterVelocity.xVelocity,
            yVelocity: $CharacterVelocity.yVelocity,
            width: character.width,
            height: character.height,
            sprite: new Sprite({
                gameObject: this,
                src: character.sprite.src || "/images/characters/players/erio.png"
            }),
            username: character.username,
            attributes: character.attributes,
            characterGender: character.characterGender,
            player: character.player,
            class: character.class,
            guild: character.guild,
            characterID: character.gameObjectID,
            items: character.items,
            direction: character.direction || "right",
        });
        return createdCharacter;
    }


    //create an interface for obj
    syncUsertoCharacter(obj) {
        let char = new $Character({
            isPlayerControlled: true,
            name: obj.username,
            x: $Utils.withGrid(6),
            y: $Utils.withGrid(6),
            sprite: new Sprite({ src: obj.src || "/images/characters/players/erio.png" }),
            width: obj.width,
            height: obj.height,
            direction: obj.direction || 'right',
            characterID: obj._id,
            username: obj.username,
            attributes: obj.attributes,
            class: obj.class,
            guild: obj.guild,
            items: obj.items,
            player: obj.player,
            location: obj.location || $MapNames.GrassyField,
            xVelocity: $CharacterVelocity.xVelocity,
            yVelocity: $CharacterVelocity.yVelocity,
        });
        this.SETCharacter(char);
        return char;
    }

    

}