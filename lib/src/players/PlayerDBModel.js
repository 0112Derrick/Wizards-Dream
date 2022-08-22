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
const characterSchema = new Schema({});
export const playerSchema = new Schema({
    username: { type: String },
    email: { type: String, index: { unique: true }, required: true },
    hash: { type: String },
    salt: { type: String },
    characters: { type: [String] },
});
playerSchema.method('validPassword', function (password) {
    const reaclHash = pbkdf2Sync(password, this.salt, 1000, 64, 'sha512');
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
        };
        player.setData(playerLocal);
    });
});
const PlayerModel = model('Players', playerSchema);
export default PlayerModel;
//# sourceMappingURL=PlayerDBModel.js.map