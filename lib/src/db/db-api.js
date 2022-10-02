import PlayerModel from "../players/PlayerDBModel.js";
import { CharacterModel as $CharacterModel } from '../players/PlayerDBModel.js';
import { CharacterAttributes } from '../app/Character.js';
async function addPlayer(playerInfo) {
    const newPlayer = new PlayerModel({
        username: playerInfo.username,
        email: playerInfo.email,
        characters: [playerInfo._id],
    });
    newPlayer.hashPassword(playerInfo.password);
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
let id = 1;
async function addCharacter(characterInfo) {
    let configCharacter = {
        characterID: id,
        username: characterInfo.username,
        atrributes: new CharacterAttributes(),
        characterGender: characterInfo.characterGender,
        class: 'none',
        guild: 'none',
        items: [''],
        player: characterInfo.player
    };
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
//# sourceMappingURL=db-api.js.map