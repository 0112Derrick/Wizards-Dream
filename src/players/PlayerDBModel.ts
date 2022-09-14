import { Model } from 'mongoose';
import pkg from 'mongoose';
import playerDataInterface from './PlayerDataInterface.js';
import { IplayerDocument } from './interfaces/IPlayerDocument.js';
import { characterDataInterface } from './PlayerDataInterface.js';
import { IcharacterDocument } from './interfaces/IPlayerDocument.js';
import { Player } from './Player.js';
import $player from './Player.js'
import Observer from '../framework/Observer.js';


const { Schema, model } = pkg;

const {
    pbkdf2Sync
} = await import('node:crypto');

let crypto;
try {
    crypto = await import('node:crypto');
} catch (err) {
    console.log('crypto support is disabled!');
}


export interface IPlayerDoc extends IplayerDocument {
    comparePassword(password: string): boolean;
    hashPassword(password: string): void;
    syncPlayer()
}

export interface IcharacterDoc extends IcharacterDocument {
    syncCharacter();
}

export interface IcharacterModel extends Model<IcharacterDoc> { }

// Define the statics interface for the User Model
// Statics apply to the model, so they are split out.
export interface IplayerModel extends Model<IPlayerDoc> { }

// Create a character schema for whatever data a player will have
// reference the character schema in

export const characterSchema = new Schema<IcharacterDoc, IcharacterModel>({
    username: { type: String },
    characterID: { type: Number },
    attributes: { type: Object },
    class: { type: String },
    guild: { type: String },
    items: { type: [String] },
});

//syncs character to data we have in db
characterSchema.method('syncCharacter', function (character): void {
    let docAsObject = this.toObject();

    let characterLocal: characterDataInterface = {
        username: docAsObject.username,
        characterID: docAsObject.characterID,
        attributes: {
            level: docAsObject.level,
            experience: docAsObject.experience,
            experienceCap: docAsObject.experirenceCap,
            statPoints: docAsObject.statPoints,
            hp: docAsObject.hp,
            sp: docAsObject.sp,
            Def: docAsObject.Def,
            Mdef: docAsObject.Mdef,
            Crit: docAsObject.Crit,


            Atk: docAsObject.atk,
            Matk: docAsObject.Matk,
            Vit: docAsObject.Vit,
            Men: docAsObject.Men,
            Dex: docAsObject.Dex,
        },
        class: docAsObject.class,
        guild: docAsObject.guild,
        items: docAsObject.items,
    }

    character.setData(characterLocal);
});

export const playerSchema = new Schema<IPlayerDoc, IplayerModel>({
    username: { type: String },
    email: { type: String, index: { unique: true }, required: true },
    hash: { type: String },
    salt: { type: String },
    characters: { type: [String] },
});

//Add method to compare password
playerSchema.method('validPassword', function (password: string): boolean {
    const reaclHash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString();

    return this.hash === reaclHash;
});

//Add method to hash password
playerSchema.method('hashPassword', function (password: string): void {
    let arrayBufferView = new Int16Array(16);
    this.salt = crypto.getRandomValues(arrayBufferView);

    this.hash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512');

    /**
 * Sync the the given member to the DB document. DB values are copied into Model.
 * @param member - The member object to sync to the user document.
 */

    playerSchema.method('syncPlayer', function (player: Player): void {
        let docAsObject = this.toObject();

        let playerLocal: playerDataInterface = {
            characters: docAsObject.characters,
            username: docAsObject.username,
            email: docAsObject.email,
        }

        player.setData(playerLocal);
    });


});

const PlayerModel = model<IPlayerDoc, IplayerModel>('Players', playerSchema);
export default PlayerModel;
