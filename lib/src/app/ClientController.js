import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { Character } from "../app/Character.js";
import { Utils } from "../app/Utils.js";
import { Direction } from "./DirectionInput.js";
import { GameMap, Overworld_Test } from "./OverworldMap.js";
import { MapNames } from "../constants/MapNames.js";
class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    socket;
    clientID = "";
    client;
    character;
    characters;
    overworldCreationCounter = 0;
    OVERWORLD;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.listenForEvent($events.SELECT_CHARACTER, (e) => { this.SETCharacter(e); }, this.view);
        this.init();
        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message); }, this.view);
    }
    async init() {
        this.socket = await io();
        this.socket.on("startOverworld", this.startOverworldOnConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client); });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id); });
        this.socket.on("reconnect", () => { window.location.reload(); });
        this.socket.on("newServerWorld", (world) => { this.createOverworld; });
        this.socket.emit("online", this.clientID);
        this.socket.on('syncPlayer', (ListOfCharacters) => { this.characterSelection(ListOfCharacters); });
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
    connect(_client) {
        this.client = _client;
        console.log(`User: ${this.client.username} is online. \n`);
        this.characters = this.client.characters;
        this.characterSelection(this.client.characters);
    }
    createOverworld(overworld) {
        let map1Config = {
            gameObjects: overworld.grassyfield.gameObjects,
            name: MapNames.GrassyField,
            lowerImageSrc: overworld.grassyfield.lowerSrc,
            upperImageSrc: overworld.grassyfield.upperSrc,
            canvas: document.querySelector("game-container").querySelector(".game-canvas"),
            element: document.querySelector(".game-container"),
        };
        let map2Config = {
            gameObjects: overworld.hallway.gameObjects,
            name: MapNames.Hallway,
            lowerImageSrc: overworld.hallway.lowerSrc,
            upperImageSrc: overworld.hallway.upperSrc,
            canvas: document.querySelector("game-container").querySelector(".game-canvas"),
            element: document.querySelector(".game-container"),
        };
        let grassyfield = new GameMap(map1Config);
        let hallway = new GameMap(map2Config);
        console.log("overworld created.");
        this.OVERWORLD = new Overworld_Test();
        this.OVERWORLD.addMap(grassyfield);
        this.OVERWORLD.addMap(hallway);
    }
    startOverworldOnConnection(startMap = MapNames.GrassyField) {
    }
    syncOverworld(overworld) {
        let matchFound = false;
        console.log("Received sync overworld response from the server.");
    }
    addCharacterToOverworld(character, map = MapNames.GrassyField) {
        switch (map) {
            case MapNames.GrassyField:
                let gameObjects = null;
                gameObjects = this.findOverWorldMapByName(map).gameObjects;
                if (!gameObjects) {
                    console.log("Map not found");
                    return;
                }
                gameObjects.forEach((object) => {
                    if (object instanceof Character) {
                        if (object.username == character.username) {
                            console.log("Character is already exists in this map.");
                            return;
                        }
                    }
                });
                gameObjects.push(new Character({
                    isPlayerControlled: true,
                    x: character.x,
                    y: character.y,
                    width: character.width,
                    height: character.height,
                    src: "/images/characters/players/erio.png",
                    username: character.username,
                    attributes: character.attributes,
                    characterGender: character.characterGender,
                    player: character.player,
                    class: character.class,
                    guild: character.guild,
                    characterID: character.gameObjectID,
                    items: character.items,
                    direction: character.direction || "right",
                }));
                break;
        }
    }
    findOverWorldMapByName(searchingMap) {
        let maps = this.OVERWORLD.Maps;
        for (let i = 0; i < maps.length; i++) {
            if (maps[i].getMapName == searchingMap) {
                return maps[i];
            }
        }
        return null;
    }
    get Character() {
        return this.character;
    }
    set SETCharacter(char) {
        this.character = char;
    }
    async characterSelection(ListOfCharacters) {
        let selectedCharacter = await this.view.selectCharacter(ListOfCharacters);
        this.SETCharacter = selectedCharacter;
        console.log(selectedCharacter.username + " was selected");
        console.log(`User: ${this.client.username} is playing on ${this.Character.username}`);
        let charJSON = ClientController.syncUsertoCharacter(selectedCharacter).toJSON();
        this.socket.emit("characterCreated", charJSON);
    }
    static syncUsertoCharacter(obj) {
        let char = new Character({
            isPlayerControlled: true,
            x: Utils.withGrid(6),
            y: Utils.withGrid(6),
            src: "/images/characters/players/erio.png",
            width: obj.width,
            height: obj.height,
            direction: obj.direction || 'right',
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
            else {
                this.moveCharacter(Direction.STANDSTILL, character);
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
            default:
                this.socket.emit("moveReq", Direction.STANDSTILL, gameOBJ);
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
                    }
                }
            });
            if (!characterCreated) {
                this.addCharacterToOverworld(character.characterObj);
            }
        });
    }
    emit(event, data = false) {
        if (data)
            this.socket.emit(event, data);
        this.socket.emit(event);
        console.log("emitting event: ", event);
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
                height: 32,
                width: 32,
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
    disconnect() {
        console.log(`User: ${this.clientID} is offline.`);
    }
    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }
    async playerLogout() {
        this.socket.emit("playerLogout", this.client);
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