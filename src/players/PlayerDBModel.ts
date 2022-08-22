import { Model } from 'mongoose';
import pkg from 'mongoose';
import playerDataInterface from './PlayerDataInterface.js';
import { IplayerDocument } from './interfaces/IPlayerDocument.js';
import IcharacterDocument from './PlayerDataInterface.js';
import { Player } from './Player.js';


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



// Define the statics interface for the User Model
// Statics apply to the model, so they are split out.
export interface IplayerModel extends Model<IPlayerDoc> { }

// Create a character schema for whatever data a player will have
// reference the character schema in 
const characterSchema = new Schema<IcharacterDocument>({


})

export const playerSchema = new Schema<IPlayerDoc, IplayerModel>({
    username: { type: String },
    email: { type: String, index: { unique: true }, required: true },
    hash: { type: String },
    salt: { type: String },
    characters: { type: [String] },
});

//Add method to compare password
playerSchema.method('validPassword', function (password: string): boolean {


    const reaclHash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512')

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