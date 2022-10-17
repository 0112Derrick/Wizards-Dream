import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { Character } from "../app/Character.js";
import { Utils } from "../app/Utils.js";
function syncUsertoCharacter(obj) {
    let char = new Character({
        isPlayerControlled: true,
        x: Utils.withGrid(6),
        y: Utils.withGrid(6),
        src: "/images/characters/players/erio.png",
        direction: 'right',
        characterID: obj._id,
        username: obj.characters.username,
        attributes: obj.characters.attributes,
        class: obj.characters.class,
        guild: obj.characters.guild,
        items: obj.characters.items,
        player: obj.characters.player,
    });
    return char;
}
class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    socket;
    clientID = "";
    client;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.init();
        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
    }
    async init() {
        this.socket = await io();
        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client); });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id); });
        this.socket.emit('connection');
        this.socket.emit("online", this.clientID);
        this.socket.on('movePlayer', () => { this.updatePlayer; });
        this.socket.on('syncUser', (obj) => { this.sync(obj); });
        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.clientID,
                serverRoom: $servers.ROOM1
            };
            this.socket.emit('playerJoinServer', data);
        });
    }
    static syncUsertoCharacter1(obj) {
        let char = new Character({
            isPlayerControlled: true,
            x: Utils.withGrid(6),
            y: Utils.withGrid(6),
            src: "/images/characters/players/erio.png",
            direction: 'right',
            characterID: obj._id,
            username: obj.characters.username,
            attributes: obj.characters.attributes,
            class: obj.characters.class,
            guild: obj.characters.guild,
            items: obj.characters.items,
            player: obj.characters.player,
        });
        return char;
    }
    sync(obj) {
        let o = ClientController.syncUsertoCharacter1(obj);
        this.socket.emit("characterCreated", o);
    }
    async movePlayer(coordniate = { x: 1, y: 1 }) {
        this.socket.emit("move", coordniate, this.socket.clientID);
        return coordniate;
    }
    updatePlayer(player) {
        console.log("player:", player.id, "moved to x: ", player.x, ', y: ', player.y);
    }
    setID(id) {
        this.clientID = id;
    }
    async createCharacter(route, data) {
        try {
            console.log("sending data to server -ClientController");
            let characterData = {
                username: "",
                characterGender: "",
                player: "",
                x: 5,
                y: 5,
                direction: "right",
                sprite: "",
            };
            console.log(data.detail);
            characterData = Object.assign(characterData, data.detail);
            let response = await this.networkProxy.postJSON(route, characterData);
            if (response && response.ok) {
                this.view.resetSignupForm();
                return Promise.resolve(true);
            }
            else {
                console.log("Something went wrong writing character, status: ", response?.status);
                return Promise.reject(false);
            }
        }
        catch (e) {
            console.log("Something went wrong writing character", e);
            return Promise.reject(false);
        }
    }
    testConnection(id) {
        console.log('connected ' + id);
    }
    connect(_client) {
        this.client = _client;
        console.log(`User: ${this.client.username} is online. \n`);
    }
    disconnect() {
        console.log(`User: ${this.clientID} is offline.`);
    }
    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }
    async playerLogout() {
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
        }
        else {
            console.log('error');
        }
    }
}
const clientController = new ClientController(new $HTMLNetwork());
//# sourceMappingURL=ClientController.js.map