import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { Character } from "../app/Character.js";
import { Utils } from "../app/Utils.js";
import { Overworld } from "./Overworld.js";
import { Direction } from "./DirectionInput.js";
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
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.OVERWORLD.init();
        this.init();
        this.listenForEvent($events.START_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = true; this.OVERWORLD.startGameLoop(); }, this.view);
        this.listenForEvent($events.STOP_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = true; }, this.view);
        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message); }, this.view);
    }
    async init() {
        this.socket = await io();
        this.OVERWORLD.init();
        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client); });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id); });
        this.socket.on("reconnect", () => { window.location.reload(); });
        this.socket.emit('connection');
        this.socket.emit("online", this.clientID);
        this.socket.on('movePlayer', () => { this.updatePlayer; });
        this.socket.on('syncPlayer', (obj) => { this.syncPlayer(obj); });
        this.socket.on("syncOverworld", (overworld) => { this.syncOverworld(overworld); });
        this.socket.on("syncPlayersMovements", (charactersMovementData) => { this.syncPlayersMovements(charactersMovementData); });
        this.socket.on("globalMessage", (message, username) => { this.postMessage(message, username); });
        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.clientID,
                serverRoom: $servers.ROOM1
            };
            this.socket.emit('playerJoinServer', data);
        });
    }
    syncOverworld(overworld) {
        let foundMatch = false;
        overworld.grassyField.gameObjects.forEach((character) => {
            foundMatch = false;
            if (character instanceof Character) {
                for (let i = 0; i < this.OverworldMaps.grassyField.gameObjects.length; i++) {
                    if (character.username == this.OverworldMaps.grassyField.gameObjects[i].username) {
                        this.OverworldMaps.grassyField.gameObjects[i].x = character.x;
                        this.OverworldMaps.grassyField.gameObjects[i].y = character.y;
                        foundMatch = true;
                        break;
                    }
                }
            }
            if (!foundMatch) {
                this.addCharacterToOverworld(character);
            }
        });
        window.OverworldMaps = this.OverworldMaps;
    }
    addCharacterToOverworld(character, map = "grassyfield") {
        switch (map) {
            case "grassyfield":
                let gameObjects = this.OverworldMaps.grassyField.gameObjects;
                gameObjects.forEach((object) => {
                    if (object instanceof Character) {
                        if (object.username == character.username) {
                            return;
                        }
                    }
                });
                gameObjects.push(new Character({
                    isPlayerControlled: true,
                    x: character.x,
                    y: character.y,
                    src: "/images/characters/players/erio.png",
                    username: character.username,
                    attributes: character.attributes,
                    characterGender: character.characterGender,
                    player: character.player,
                    class: character.class,
                    guild: character.guild,
                    characterID: character.gameObjectID,
                    items: character.items,
                    direction: "right",
                }));
                break;
        }
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
            username: obj.username,
            attributes: obj.attributes,
            class: obj.class,
            guild: obj.guild,
            items: obj.items,
            player: obj.player,
        });
        return char;
    }
    serverRequestMoveCharacter(character, moveDirection) {
        console.log("character id:" + character.player + '\nclient character id:' + this.client.characters.at(0).player);
        if (character.player == this.client.characters.at(0).player) {
            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req");
                this.moveCharacter(moveDirection, character);
            }
            console.log('ClientController func requestServerGameObjectMove\n Direction: ' + moveDirection);
        }
    }
    moveCharacter(direction, gameOBJ) {
        switch (direction) {
            case Direction.UP:
                if (gameOBJ.y - 0.5 <= 10) {
                    return;
                }
                else {
                    this.socket.emit("moveReq", Direction.UP, gameOBJ);
                }
                break;
            case Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                }
                else {
                    this.socket.emit("moveReq", Direction.DOWN, gameOBJ);
                }
                break;
            case Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                }
                else {
                    this.socket.emit("moveReq", Direction.LEFT, gameOBJ);
                }
                break;
            case Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                }
                else {
                    this.socket.emit("moveReq", Direction.RIGHT, gameOBJ);
                }
                break;
        }
    }
    syncPlayersMovements(charactersMovementData) {
        let characterCreated = false;
        charactersMovementData.forEach((character) => {
            window.OverworldMaps.grassyField.gameObjects.forEach((char) => {
                if (char instanceof Character) {
                    console.log("username: " + character.characterObj.username + " searching username: " + char.username);
                    if (character.characterObj.username == char.username) {
                        char.updateCharacterLocationAndAppearance({ arrow: character.direction });
                        char.x = character.delta.x;
                        char.y = character.delta.y;
                        characterCreated = true;
                        setTimeout(() => { char.updateCharacterLocationAndAppearance({ arrow: null }); }, 1000);
                    }
                }
            });
            if (!characterCreated) {
                this.addCharacterToOverworld(character.characterObj);
            }
        });
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
    checkMessage(message) {
        let cleanMessage = '';
        if (message) {
            cleanMessage = message;
        }
        this.sendMessage(cleanMessage.detail, this.client.characters.at(0).username);
    }
    sendMessage(message, user) {
        this.socket.emit("message", message, user);
    }
    postMessage(message, username) {
        this.view.postMessage(message, username);
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
        if (this.client.characters.at(0))
            console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).username}`);
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
            this.socket.emit("playerLogout", this.client);
        }
        else {
            console.log('error');
        }
    }
}
export const clientController = new ClientController(new $HTMLNetwork());
//# sourceMappingURL=ClientController.js.map