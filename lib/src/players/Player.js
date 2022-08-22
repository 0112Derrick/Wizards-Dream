export class Player {
    data;
    constructor() {
        this.data = {
            username: 'username',
            email: 'email@fakeEmail.com',
            characters: [],
        };
    }
    addCharacter(character) {
    }
    getData() { return this.data; }
    ;
    setData(playerData) {
        Object.assign(this.data, playerData);
    }
}
//# sourceMappingURL=Player.js.map