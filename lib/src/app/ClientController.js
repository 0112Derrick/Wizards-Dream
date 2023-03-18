import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { Character as $Character } from "../app/Character.js";
import { Utils } from "../app/Utils.js";
import { Direction } from "./DirectionInput.js";
import { GameMap } from "./GameMap";
import { Overworld_Test } from "./Overworld_Test";
import { MapNames } from "../constants/MapNames.js";
class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    socket;
    clientID = "";
    client;
    character = null;
    characters = [];
    static clientController = null;
    nav;
    grassyfieldConfig = {
        gameObjects: [],
        activeCharacters: null,
        name: MapNames.GrassyField,
        lowerImageSrc: '/images/maps/Battleground1.png',
        upperImageSrc: '/images/maps/Battleground1.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
    };
    hallwayConfig = {
        gameObjects: [],
        activeCharacters: null,
        name: MapNames.Hallway,
        lowerImageSrc: '/images/maps/Battleground2.png',
        upperImageSrc: '/images/maps/Battleground2.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
    };
    OVERWORLD = null;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.init();
        this.listenForEvent($events.SELECT_CHARACTER, (e) => { ClientController.ClientControllerInstance.characterSelectionCallback(e); }, this.view);
        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);
        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message); }, this.view);
    }
    static get ClientControllerInstance() {
        if (this.clientController == null) {
            this.clientController = new ClientController(new $HTMLNetwork());
        }
        return this.clientController;
    }
    async init() {
        this.socket = await io();
        this.socket.on("startOverworld", this.startOverworldOnConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client); });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id); });
        this.socket.on("reconnect", () => { window.location.reload(); });
        this.socket.on("newServerWorld", () => { this.createOverworld; });
        this.socket.on("updatedGameObjects", (gameObjects, map) => {
            this.updateGameObjects;
        });
        this.socket.emit("online", this.clientID);
        this.socket.on('syncPlayer', (ListOfCharacters) => { this.sendViewCharacterSelection(ListOfCharacters); });
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
    get Character() {
        return this.character;
    }
    SETCharacter(char) {
        this.character = char;
    }
    setID(id) {
        this.clientID = id;
    }
    connect(_client) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.client = _client;
        console.log(`User: ${clientController.client.username} is online. \n`);
        clientController.characters = clientController.client.characters;
        clientController.sendViewCharacterSelection(clientController.client.characters);
        clientController.createOverworld();
        clientController.startOverworldOnConnection();
    }
    createOverworld() {
        let clientController = ClientController.ClientControllerInstance;
        let grassyfield = new GameMap(clientController.grassyfieldConfig);
        let hallway = new GameMap(clientController.hallwayConfig);
        console.log("overworld created.");
        clientController.OVERWORLD = new Overworld_Test();
        clientController.OVERWORLD.addMap(grassyfield);
        clientController.OVERWORLD.addMap(hallway);
    }
    startOverworldOnConnection(startMap = MapNames.GrassyField) {
        if (ClientController.ClientControllerInstance.OVERWORLD == null) {
            clientController.createOverworld();
        }
        clientController.socket.emit("requestOverworldGameObjects", startMap);
        console.log('Starting new Oveworld map');
        ClientController.ClientControllerInstance.OVERWORLD.init(startMap);
    }
    updateGameObjects(gameObjects, updatedMap) {
        ClientController.ClientControllerInstance.OVERWORLD.Maps.forEach(map => {
            if (map.getMapName == updatedMap) {
                map.gameObjects = gameObjects;
            }
        });
    }
    changeGameMap(map) {
        ClientController.ClientControllerInstance.OVERWORLD.init(map);
    }
    syncOverworld(overworld) {
        let matchFound = false;
        console.log("Received sync overworld response from the server.");
    }
    addCharacterToOverworld(character, map = MapNames.GrassyField) {
        let clientController = ClientController.ClientControllerInstance;
        switch (map) {
            case MapNames.GrassyField:
                let gameObjects = null;
                gameObjects = clientController.findOverWorldMapByName(map).gameObjects;
                if (!gameObjects) {
                    console.log("Map not found");
                    return;
                }
                gameObjects.forEach((object) => {
                    if (object instanceof $Character) {
                        if (object.username == character.username) {
                            console.log("Character is already exists in this map.");
                            return;
                        }
                    }
                });
                gameObjects.push(new $Character({
                    isPlayerControlled: true,
                    x: character.x,
                    y: character.y,
                    xVelocity: character.xVelocity || 0,
                    yVelocity: character.yVelocity || 0,
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
        let clientController = ClientController.ClientControllerInstance;
        let maps = clientController.OVERWORLD.Maps;
        for (let i = 0; i < maps.length; i++) {
            if (maps[i].getMapName == searchingMap) {
                return maps[i];
            }
        }
        return null;
    }
    sendViewCharacterSelection(ListOfCharacters) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.view.createCharacterSelectionButtons(ListOfCharacters);
    }
    characterSelectionCallback(data) {
        let clientController = ClientController.ClientControllerInstance;
        let characterPosition = data.detail;
        clientController.SETCharacter(clientController.characters.at(characterPosition));
        console.log(`User: ${clientController.client.username} is playing on ${clientController.character.username}`);
        let characterOBJ = ClientController.syncUsertoCharacter(clientController.character);
        clientController.socket.emit("characterCreated", characterOBJ, characterOBJ.location, this.clientID);
    }
    static syncUsertoCharacter(obj) {
        let char = new $Character({
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
        clientController.SETCharacter(char);
        return char;
    }
    serverRequestMoveCharacter(character, moveDirection) {
        console.log("character id:" + character.player + '\nclient character id:' + this.client.characters.at(0).player);
        let clientController = ClientController.ClientControllerInstance;
        if (character.player == this.client.characters.at(0).player) {
            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req");
                clientController.moveCharacter(moveDirection, character);
            }
            else {
                clientController.moveCharacter(Direction.STANDSTILL, character);
            }
            console.log('ClientController func requestServerGameObjectMove\n Direction: ' + moveDirection);
        }
    }
    moveCharacter(direction, gameOBJ) {
        let clientController = ClientController.ClientControllerInstance;
        switch (direction) {
            case Direction.UP:
                if (gameOBJ.y - 0.5 <= 10) {
                    return;
                }
                else {
                    clientController.socket.emit("moveReq", Direction.UP, gameOBJ);
                }
                break;
            case Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                }
                else {
                    clientController.socket.emit("moveReq", Direction.DOWN, gameOBJ);
                }
                break;
            case Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                }
                else {
                    clientController.socket.emit("moveReq", Direction.LEFT, gameOBJ);
                }
                break;
            case Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                }
                else {
                    clientController.socket.emit("moveReq", Direction.RIGHT, gameOBJ);
                }
                break;
            default:
                clientController.socket.emit("moveReq", Direction.STANDSTILL, gameOBJ);
        }
    }
    syncPlayersMovements(charactersMovementData) {
        let characterCreated = false;
        charactersMovementData.forEach((character) => {
            window.OverworldMaps.grassyField.gameObjects.forEach((char) => {
                if (char instanceof $Character) {
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
                clientController.addCharacterToOverworld(character.characterObj);
            }
        });
    }
    emit(event, data = false) {
        if (data)
            clientController.socket.emit(event, data);
        clientController.socket.emit(event);
        console.log("emitting event: ", event);
    }
    checkMessage(message) {
        let cleanMessage = '';
        if (message) {
            cleanMessage = message;
        }
        clientController.sendMessage(cleanMessage.detail, clientController.character.username);
    }
    sendMessage(message, user) {
        clientController.socket.emit("message", message, user);
    }
    postMessage(message, username) {
        clientController.view.postMessage(message, username);
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
                location: MapNames.GrassyField,
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