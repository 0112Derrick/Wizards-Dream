import PlayerModel from "../players/PlayerDBModel.js";
async function addPlayer(playerInfo) {
    const newPlayer = new PlayerModel({
        username: playerInfo.username,
        email: playerInfo.email,
        characters: [],
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
export { addPlayer };
//# sourceMappingURL=db-api.js.map