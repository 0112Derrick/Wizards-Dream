import mongoose, { Model } from "mongoose";
import pkg from "mongoose";
import playerDataInterface from "./interfaces/CharacterDataInterface.js";
import {
  IplayerDocument,
  IcharacterDocument,
} from "./interfaces/IPlayerDocument.js";
import { characterDataInterface } from "./interfaces/CharacterDataInterface.js";
import { Player } from "./Player.js";
import $player from "./Player.js";
import Observer from "../framework/Observer.js";

const { Schema, model } = pkg;

const { pbkdf2Sync } = await import("node:crypto");

try {
  var crypto = await import("node:crypto");
} catch (err) {
  console.log("crypto support is disabled!");
}

export interface IPlayerDoc extends IplayerDocument {
  comparePassword(password: string): boolean;
  hashPassword(password: string): void;
  syncPlayer();
  validPassword(password: string): boolean;
}

export interface IcharacterDoc extends IcharacterDocument {
  syncCharacter();
}

export interface IcharacterModel extends Model<IcharacterDoc> {}

// Define the statics interface for the User Model
// Statics apply to the model, so they are split out.
export interface IplayerModel extends Model<IPlayerDoc> {}

// Create a character schema for whatever data a player will have
// reference the character schema in

export const characterSchema = new Schema<IcharacterDoc, IcharacterModel>({
  username: { type: String, index: { unique: true }, required: true },
  gameObjectID: { type: Number, required: true },
  characterGender: { type: String },
  direction: { type: String },
  width: { type: Number },
  height: { type: Number },
  unlockedSkills: { type: [Object] },
  friends: { type: [Object] },
  attributes: { type: Object },
  class: { type: String },
  guild: { type: String },
  equipment: { type: Object },
  items: { type: [String] },
  player: { type: Schema.Types.ObjectId, ref: "Players" },
});

//syncs character to data we have in db
characterSchema.method("syncCharacter", function (character): void {
  let docAsObject = this.toObject();

  let characterLocal: characterDataInterface = {
    username: docAsObject.username,
    gameObjectID: docAsObject.characterID,
    characterGender: docAsObject.characterGender,
    width: docAsObject.width,
    height: docAsObject.height,
    unlockedSkills: docAsObject.skills,
    location: docAsObject.location,
    attributes: {
      level: docAsObject.level,
      experience: docAsObject.experience,
      experienceCap: docAsObject.experirenceCap,
      statPoints: docAsObject.statPoints,
      hp: docAsObject.hp,
      sp: docAsObject.sp,
      def: docAsObject.Def,
      mdef: docAsObject.Mdef,
      crit: docAsObject.Crit,

      Atk: docAsObject.atk,
      Matk: docAsObject.Matk,
      Vit: docAsObject.Vit,
      Men: docAsObject.Men,
      Dex: docAsObject.Dex,
      hpCap: 0,
      spCap: 0,
    },
    class: docAsObject.class,
    guild: docAsObject.guild,
    items: docAsObject.items,
    player: docAsObject.player,
    friends: docAsObject.friends,
    equipment: docAsObject.equipment,
    x: docAsObject.x,
    y: docAsObject.y,
    sprite: docAsObject.sprite,
    direction: docAsObject.direction,
    xVelocity: docAsObject.xVelocity,
    yVelocity: docAsObject.yVelocity,
    name: docAsObject.name,
  };

  character.setData(characterLocal);
});

export const playerSchema = new Schema<IPlayerDoc, IplayerModel>({
  username: { type: String, index: { unique: true }, required: true },
  email: { type: String, index: { unique: true }, required: true },
  hash: { type: String },
  salt: { type: String },
  characters: [{ type: Schema.Types.ObjectId, ref: "Characters" }],
});

//Add method to compare password
playerSchema.method("validPassword", function (password: string): boolean {
  const reaclHash = pbkdf2Sync(
    password,
    this.salt,
    1000,
    64,
    "sha512"
  ).toString();

  return this.hash === reaclHash;
});

/* crypto.createHash("sha256");
  this.salt.on("readable", () => {
    // Only one element is going to be produced by the
    // hash stream.
    const data = this.salt.read();
    if (data) {
      console.log(data.toString("hex"));
      // Prints:
      //   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
    }
  });

  this.salt.write("some data to hash");
  this.salt.end(); */

//Add method to hash password
/* playerSchema.method("hashPassword", function (password: string): void {
  let arrayBufferView = new Int16Array(16);
  this.salt = crypto.randomBytes(16).toString();
  this.salt = getRandomValues(arrayBufferView);

  this.hash = pbkdf2Sync(password, this.salt, 1000, 64, "sha512");
}); */
playerSchema.method(
  "hashPassword",
  function (this: IPlayerDoc, password: string): void {
    this.salt = crypto.randomBytes(16).toString("hex"); // Use hex encoding for better results
    this.hash = crypto
      .pbkdf2Sync(password, this.salt, 1000, 64, "sha512")
      .toString("hex");
  }
);

/**
 * Sync the the given member to the DB document. DB values are copied into Model.
 * @param member - The member object to sync to the user document.
 */

playerSchema.method("syncPlayer", function (player: Player): void {
  let docAsObject = this.toObject();

  let playerLocal: playerDataInterface = {
    characters: docAsObject.characters,
    username: docAsObject.username,
    email: docAsObject.email,
    playerID: docAsObject._id,
  };

  player.setData(playerLocal);
});

export const CharacterModel = model<IcharacterDoc, IcharacterModel>(
  "Characters",
  characterSchema
);
const PlayerModel = model<IPlayerDoc, IplayerModel>("Players", playerSchema);
export default PlayerModel;
