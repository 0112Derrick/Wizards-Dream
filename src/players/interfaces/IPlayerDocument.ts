import { Document } from "mongoose";
import playerDataInterface from "./CharacterDataInterface.js";
import { characterDataInterface } from './CharacterDataInterface.js';

export interface IplayerDocument extends Document, playerDataInterface {
    hash: string,
    salt: string,
}

export interface IcharacterDocument extends Document, characterDataInterface {

}
