import pkg from 'mongoose';
const { Schema, model } = pkg;
const { pbkdf2Sync } = await import('node:crypto');
let crypto;
try {
    crypto = await import('node:crypto');
}
catch (err) {
    console.log('crypto support is disabled!');
}
export const characterSchema = new Schema({
    username: { type: String, index: { unique: true }, required: true },
    gameObjectID: { type: Number, required: true },
    characterGender: { type: String },
    direction: { type: String },
    width: { type: Number },
    height: { type: Number },
    friends: { type: [Object] },
    attributes: { type: Object },
    class: { type: String },
    guild: { type: String },
    equipment: { type: Object },
    items: { type: [String] },
    player: { type: Schema.Types.ObjectId, ref: 'Players' }
});
characterSchema.method('syncCharacter', function (character) {
    let docAsObject = this.toObject();
    let characterLocal = {
        username: docAsObject.username,
        gameObjectID: docAsObject.characterID,
        characterGender: docAsObject.characterGender,
        width: docAsObject.width,
        height: docAsObject.height,
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
        direction: docAsObject.direction
    };
    character.setData(characterLocal);
});
export const playerSchema = new Schema({
    username: { type: String, index: { unique: true }, required: true },
    email: { type: String, index: { unique: true }, required: true },
    hash: { type: String },
    salt: { type: String },
    characters: [{ type: Schema.Types.ObjectId, ref: 'Characters' }],
});
playerSchema.method('validPassword', function (password) {
    const reaclHash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString();
    return this.hash === reaclHash;
});
playerSchema.method('hashPassword', function (password) {
    let arrayBufferView = new Int16Array(16);
    this.salt = crypto.getRandomValues(arrayBufferView);
    this.hash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512');
    playerSchema.method('syncPlayer', function (player) {
        let docAsObject = this.toObject();
        let playerLocal = {
            characters: docAsObject.characters,
            username: docAsObject.username,
            email: docAsObject.email,
            playerID: docAsObject._id
        };
        player.setData(playerLocal);
    });
});
export const CharacterModel = model('Characters', characterSchema);
const PlayerModel = model('Players', playerSchema);
export default PlayerModel;
//# sourceMappingURL=PlayerDBModel.js.map