export class Player {
    data;
    static emailRegEx = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    eventEmitter;
    callback;
    target;
    constructor() {
        this.data = {
            username: 'username',
            email: 'email@fakeEmail.com',
            characters: [],
            playerID: '',
        };
        this.eventEmitter = null;
        this.callback = null;
    }
    initEmitter(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    addCharacter(character) {
        this.data.characters.push(character);
    }
    getData() { return this.data; }
    ;
    setData(playerData) {
        Object.assign(this.data, playerData);
    }
    async storePlayer(playerData, dispatchEvent = false) {
        this.data = Object.assign(this.data, playerData);
    }
    validateEmail(email) {
        if (email && Player.emailRegEx.test(email)) {
            return true;
        }
        else {
            return false;
        }
    }
    setCallback(callback, target) {
        this.callback = callback;
        this.target = target;
    }
    async fetchPlayerInfo(c) {
        let data = null;
        if (this.callback) {
            data = await c();
        }
        return data;
    }
}
export default new Player();
//# sourceMappingURL=Player.js.map