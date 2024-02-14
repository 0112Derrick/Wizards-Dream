import mongoose from "mongoose";
import { userInfo } from "os";
import PlayerModel from "../players/PlayerDBModel.js";
import { CharacterCreationDataInterface as $characterSignup } from "../players/interfaces/CharacterDataInterface.js";
import { CharacterModel as $CharacterModel } from "../players/PlayerDBModel.js";
import { CharacterAttributes } from "../app/CharacterAttributes";
import { CharacterAttributesConstants as $chAttr } from "../constants/CharacterAttributesConstants.js";
import { characterDataInterface } from "../players/interfaces/CharacterDataInterface.js";
import { Sprite } from "../app/Sprite.js";
import { MapNames } from "../constants/MapNames.js";
import { Direction } from "../app/DirectionInput.js";

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
    } else {
      return console.log("Player Saved");
    }
  });
  return Promise.resolve(newPlayer);
}

//Add the new character to the DB.
let id = Date.now();
const randomNum = Math.floor(Math.random() * 1000);
id += randomNum;
async function addCharacter(characterInfo: $characterSignup) {
  let png: string;

  if (characterInfo.characterGender == "male") {
    png = "/images/characters/players/erio.png";
  } else {
    png = "/images/characters/players/erio.png";
  }

  let configCharacter: characterDataInterface = {
    gameObjectID: id,
    username: characterInfo.username,
    characterGender: characterInfo.characterGender,
    x: 0,
    y: 0,
    sprite: png || "/images/characters/players/erio.png",
    direction: Direction.RIGHT,
    location: MapNames.GrassyField,
    width: characterInfo.width,
    height: characterInfo.height,
    attributes: {
      level: 1,
      experience: $chAttr.experience,
      experienceCap: $chAttr.experienceCap,
      statPoints: $chAttr.statPoints,
      hp: $chAttr.hp,
      sp: $chAttr.sp,
      def: $chAttr.def,
      mdef: $chAttr.mdef,
      crit: $chAttr.crit,

      Atk: $chAttr.Atk,
      Matk: $chAttr.Matk,
      Vit: $chAttr.Vit,
      Men: $chAttr.Men,
      Dex: $chAttr.Dex,
      hpCap: $chAttr.hpCap,
      spCap: $chAttr.spCap,
    },
    equipment: {
      head: null,
      chest: null,
      legs: null,
      weapon: null,
    },
    unlockedSkills: [],
    class: "",
    friends: [],
    guild: "",
    items: [],
    player: characterInfo.player,
    xVelocity: characterInfo.xVelocity,
    yVelocity: characterInfo.yVelocity,
    name: characterInfo.name,
  };

  const newCharacter = new $CharacterModel(configCharacter);

  await newCharacter.save(function (err, newCharacter) {
    if (err) {
      return console.log(err);
    } else {
      return console.log("Character saved");
    }
  });
  return Promise.resolve(newCharacter);
}

export { addPlayer, addCharacter };
