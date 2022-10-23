import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { View as $MainAppView } from "./ClientView.js";
import { Utils } from "../app/Utils.js";
import { Overworld } from "./Overworld.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { Character } from "../app/Character.js";
(function () {
    const OVERWORLD = new Overworld({
        element: document.querySelector(".game-container")
    });
    OVERWORLD.init();
});
class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    socket;
    clientID = "";
    client;
    character;
    OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    };
    OVERWORLD = new Overworld({
        element: document.querySelector(".game-container")
    });
    constructor(_networkProxy) {
        super();
        this.networkProxy = _networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.init();
        this.listenForEvent($events.CHARACTER_CREATE, (e) => {
            this.createCharacter(CharacterCreateRoute, e);
        }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
    }
    initSocketReceiveEvents() {
        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client); });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id); });
        this.socket.on("reconnect", () => { window.location.reload(); });
        this.socket.on('movePlayer', () => { this.updatePlayer; });
        this.socket.on('syncPlayer', (obj) => { this.syncPlayer(obj); });
        this.socket.on("syncOverworld", (overworld) => { this.syncOverworld(overworld); });
    }
    async init() {
        this.socket = await io();
        this.OVERWORLD.init();
        this.initSocketReceiveEvents();
        this.socket.emit('connection');
        this.socket.emit("online", this.clientID);
        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.clientID,
                serverRoom: $servers.ROOM1
            };
            this.socket.emit('playerJoinServer', data);
        });
    }
    syncOverworld(overworldRemote) {
        let foundMatch = false;
        overworldRemote.grassyField.gameObjects.forEach(remoteCharacter => {
            this.OverworldMaps.grassyField.gameObjects.forEach(localCharacter => {
                if (remoteCharacter.name == localCharacter.name) {
                    localCharacter.x = remoteCharacter.x;
                    localCharacter.y = remoteCharacter.y;
                    foundMatch = true;
                    console.log("\nFound character " + remoteCharacter.name);
                    return;
                }
            });
            if (!foundMatch) {
                this.OverworldMaps.grassyField.gameObjects.push(new Character({
                    isPlayerControlled: true,
                    x: remoteCharacter.x,
                    y: remoteCharacter.y,
                    src: "/images/characters/players/erio.png",
                    name: remoteCharacter.name,
                    attributes: remoteCharacter.attributes,
                    characterGender: remoteCharacter.gender,
                    player: remoteCharacter.player,
                    class: remoteCharacter.class,
                    guild: remoteCharacter.guild,
                    characterID: remoteCharacter.characterID,
                    items: remoteCharacter.items,
                    direction: "right",
                }));
                console.log("\nPushing new character " + remoteCharacter.name);
            }
            foundMatch = false;
        });
        window.OverworldMaps = this.OverworldMaps;
    }
    get Character() {
        return this.character;
    }
    set SETCharacter(char) {
        this.character = char;
    }
    static syncUsertoCharacter(obj) {
        let char = new Character({
            isPlayerControlled: true,
            x: Utils.withGrid(6),
            y: Utils.withGrid(6),
            src: "/images/characters/players/erio.png",
            direction: 'right',
            characterID: obj._id,
            name: obj.name,
            attributes: obj.attributes,
            class: obj.class,
            guild: obj.guild,
            items: obj.items,
            player: obj.player,
        });
        return char;
    }
    requestMove(obj, direction) {
        if (direction) {
            if (obj.characterID == this.client.characters.at(0)._id) {
                console.log("movement req");
                this.socket.emit("moveReq", direction, obj.toJSON());
            }
        }
    }
    syncPlayer(obj) {
        let charJSON = ClientController.syncUsertoCharacter(obj).toJSON();
        this.socket.emit("characterCreated", charJSON);
    }
    emit(event, data = false) {
        if (data)
            this.socket.emit(event, data);
        this.socket.emit(event);
        console.log("emitting event: ", event);
    }
    async movePlayer(direction) {
        this.socket.emit("move", direction, this.socket.clientID);
        return direction;
    }
    updatePlayer(player) {
        console.log("player:", player.id, "moved to x: ", player.x, ', y: ', player.y);
    }
    setID(id) {
        this.clientID = id;
    }
    async createCharacter(routeCreateCharacter, data) {
        try {
            console.log("sending data to server -ClientController");
            let characterData = {
                name: "",
                characterGender: "",
                player: "",
                x: 5,
                y: 5,
                direction: "right",
                sprite: "",
            };
            console.log(data.detail);
            characterData = Object.assign(characterData, data.detail);
            let response = await this.networkProxy.postJSON(routeCreateCharacter, characterData);
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
        if (this.client.characters.at(0))
            console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).name}`);
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
export const clientController = new ClientController(new $HTMLNetwork());
//# sourceMappingURL=ClientController.js.map