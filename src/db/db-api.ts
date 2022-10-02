import mongoose from "mongoose";
import { userInfo } from "os";
import PlayerModel from "../players/PlayerDBModel.js";
import { CharacterCreationDataInterface as $characterSignup } from '../players/PlayerDataInterface.js'
import { CharacterModel as $CharacterModel } from '../players/PlayerDBModel.js'
import { CharacterAttributes } from '../app/Character.js'



async function addPlayer(playerInfo) {

    const newPlayer = new PlayerModel({
        username: playerInfo.username,
        email: playerInfo.email,
        characters: [playerInfo._id],
    });

    newPlayer.hashPassword(playerInfo.password);

    //Add the new player to the DB.
    await newPlayer.save(function (err, newPlayer) {
        if (err) {
            return console.log(err);
        }
        else {
            return console.log('Player Saved');
        }
    });
    return Promise.resolve(newPlayer);
}

//Add the new character to the DB.
let id = 1;
async function addCharacter(characterInfo: $characterSignup) {
    let configCharacter = {
        characterID: id,
        username: characterInfo.username,
        atrributes: new CharacterAttributes(),
        characterGender: characterInfo.characterGender,
        class: 'none',
        guild: 'none',
        items: [''],
        player: characterInfo.player
    }
    id += 1;

    const newCharacter = new $CharacterModel(configCharacter);

    await newCharacter.save(function (err, newCharacter) {
        if (err) {
            return console.log(err);
        }
        else {
            return console.log('Character saved');
        }
    });
    return Promise.resolve(newCharacter);
}



export { addPlayer, addCharacter };