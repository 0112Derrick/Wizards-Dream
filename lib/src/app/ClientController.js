import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events } from '../constants/EventConstants.js';
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { Character as $Character } from "../app/Character.js";
import { Utils } from "../app/Utils.js";
import { Direction } from "./DirectionInput.js";
import { GameMap } from "./GameMap.js";
import { Overworld_Test } from "./Overworld_Test.js";
import { MapNames } from "../constants/MapNames.js";
import { CharacterVelocity as $CharacterVelocity, CharacterSize as $CharacterSize } from "../constants/CharacterAttributesConstants.js";
import { Sprite } from "./Sprite.js";
export class ClientController extends $OBSERVER {
    view = $MainAppView;
    networkProxy;
    socket;
    clientID = "";
    client;
    character = null;
    characters = [];
    static clientController = null;
    activeServer = null;
    grassyfieldConfig = {
        gameObjects: new Array(),
        activeCharacters: null,
        name: MapNames.GrassyField,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground1.png',
        upperImageSrc: '/images/maps/Battleground1.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
    };
    hallwayConfig = {
        gameObjects: new Array(),
        activeCharacters: null,
        name: MapNames.Hallway,
        mapMinHeight: 0,
        mapMinWidth: 20,
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
        this.listenForEvent($events.REQUEST_SERVER_ROOMS, () => {
            ClientController.ClientControllerInstance.requestActiveServers();
        }, this.view);
        this.listenForEvent($events.SELECT_SERVER, (data) => {
            ClientController.ClientControllerInstance.joinServer(data);
        }, this.view);
        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message); }, this.view);
        document.addEventListener('visibilitychange', () => {
            console.log('Visibility state:', document.visibilityState);
            if (document.visibilityState === 'visible') {
                if (!this.socket || this.socket.disconnected) {
                    console.log('Reconnecting socket...');
                    this.init();
                }
            }
        });
    }
    static get ClientControllerInstance() {
        if (this.clientController == null) {
            this.clientController = new ClientController(new $HTMLNetwork());
        }
        return this.clientController;
    }
    async connectSocket() {
        this.socket = await io();
        this.socket.on('connect', () => {
            console.log('Socket connected:' + this.socket.id);
            this.clientID = this.socket.id;
        });
        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }
    async init() {
        this.connectSocket().then(() => {
            this.socket.on($socketRoutes.RESPONSE_CLIENT_JOINED_SERVER, this.playerJoinedServer);
            this.socket.on($socketRoutes.RESPONSE_ONLINE_CLIENT, (client) => { this.connect(client); });
            this.socket.on($socketRoutes.RESPONSE_OFFLINE_CLIENT, this.disconnect);
            this.socket.on($socketRoutes.RESPONSE_RECONNECT_CLIENT, () => {
                if (!document.hidden) {
                    window.location.reload();
                }
            });
            this.socket.on($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, (gameObjects, map) => {
                this.updateGameObjects;
            });
            this.socket.on($socketRoutes.RESPONSE_SYNC_OVERWORLD, (overworld) => { this.syncOverworld(overworld); });
            this.socket.on($socketRoutes.RESPONSE_SYNC_PLAYERS_MOVEMENTS, (charactersMovementData) => { this.syncPlayersMovements(charactersMovementData); });
            this.socket.on($socketRoutes.RESPONSE_MESSAGE, (message, username) => { this.postMessage(message, username); });
            this.socket.on($socketRoutes.RESPONSE_SERVER_MESSAGE, (message) => { this.postMessage(message, 'Server'); });
            this.socket.on($socketRoutes.RESPONSE_ACTIVE_SERVERS, (servers) => {
                this.receiveActiveServers(servers);
            });
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
        clientController.createOverworld();
        clientController.client = _client;
        console.log(`User: ${clientController.client.username} is online. \n`);
        this.socket.emit($socketRoutes.REQUEST_CLIENT_ONLINE, this.clientID);
        clientController.characters = clientController.client.characters;
        clientController.sendViewCharacterSelection(clientController.client.characters);
        clientController.startOverworldOnConnection();
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
        clientController.socket.emit($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, characterOBJ, characterOBJ.location, this.clientID);
        clientController.OVERWORLD.Maps.forEach(map => {
            if (map.getMapName == clientController.character.location || clientController.character.location == null && map.getMapName == MapNames.GrassyField) {
                if (!clientController.character.location) {
                    clientController.character.location = MapNames.GrassyField;
                }
                map.setClientCharacter(clientController.character);
            }
        });
        clientController.addCharacterToOverworld(clientController.character, clientController.character.location);
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
        let clientController = ClientController.ClientControllerInstance;
        if (clientController.OVERWORLD == null) {
            clientController.createOverworld();
        }
        clientController.socket.emit("requestOverworldGameObjects", startMap);
        console.log('Starting new Oveworld map');
        clientController.OVERWORLD.init(startMap);
    }
    updateGameObjects(gameObjects, updatedMap) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.OVERWORLD.Maps.forEach(map => {
            if (map.getMapName == updatedMap) {
                map.syncGameObjects(gameObjects);
            }
        });
    }
    requestActiveServers() {
        let clientController = ClientController.ClientControllerInstance;
        clientController.socket.emit($socketRoutes.REQUEST_ACTIVE_SERVERS);
    }
    receiveActiveServers(serverRooms) {
        let clientController = ClientController.ClientControllerInstance;
        if (serverRooms.length < 0) {
            console.log(serverRooms + "is empty");
            return;
        }
        clientController.view.createServerSelectionButtons(serverRooms);
    }
    joinServer(serverRoom) {
        let clientController = ClientController.ClientControllerInstance;
        console.log("controller: Server room selected: " + serverRoom.detail);
        clientController.activeServer = serverRoom.detail;
        clientController.socket.emit($socketRoutes.REQUEST_JOIN_SERVER_ROOM, clientController.clientID, serverRoom.detail);
    }
    changeGameMap(map) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.OVERWORLD.init(map);
    }
    syncOverworld(overworld) {
        console.log("Received sync overworld data: " + overworld);
        this.OVERWORLD.Maps.forEach((map) => {
            if (map.getMapName == MapNames.GrassyField) {
                map.syncActiveCharacters(overworld.grassyfield.activePlayers);
                if (!Array.isArray(overworld.grassyfield.gameObjects)) {
                    console.log("GameObjects grassyfield: ", overworld.grassyfield.gameObjects, " Type: ", typeof overworld.grassyfield.gameObjects);
                    let syncedOverworldGameObjects = Object.values(overworld.grassyfield.gameObjects);
                    let updatedObjects = [];
                    syncedOverworldGameObjects.forEach((character) => {
                        if (character.name == this.Character.name || character.player == this.Character.player) {
                            updatedObjects.push(this.Character);
                        }
                        else {
                            updatedObjects.push(this.createCharacterFromCharacterDataI(character));
                        }
                    });
                    map.syncGameObjects(updatedObjects);
                }
                else {
                    let updatedObjects = [];
                    overworld.grassyfield.gameObjects.forEach((character) => {
                        if (character.username == ClientController.ClientControllerInstance.character.username) {
                            updatedObjects.push(ClientController.ClientControllerInstance.Character);
                        }
                        else {
                            updatedObjects.push(this.createCharacterFromCharacterDataI(character));
                        }
                    });
                    map.syncGameObjects(updatedObjects);
                }
            }
            if (map.getMapName == MapNames.Hallway) {
                map.syncActiveCharacters(overworld.hallway.activePlayers);
                if (!Array.isArray(overworld.hallway.gameObjects)) {
                    console.log("GameObjects hallway: ", overworld.hallway.gameObjects, " Type: ", typeof overworld.hallway.gameObjects);
                    let syncedOverworldGameObjects = Object.values(overworld.hallway.gameObjects);
                    let updatedObjects = [];
                    syncedOverworldGameObjects.forEach((character) => {
                        updatedObjects.push(this.createCharacterFromCharacterDataI(character));
                    });
                    map.syncGameObjects(updatedObjects);
                }
                else {
                    let updatedObjects = [];
                    overworld.hallway.gameObjects.forEach((character) => {
                        updatedObjects.push(this.createCharacterFromCharacterDataI(character));
                    });
                    map.syncGameObjects(updatedObjects);
                }
            }
        });
    }
    findRecentlyAddedCharacters(currentPlayers, newPlayers) {
        let newPlayersList = new Array();
        console.log("newPlayers: ", newPlayers, " Type: ", typeof newPlayers);
        if (typeof newPlayers === 'object' && !(newPlayers instanceof Map)) {
            newPlayers = new Map(Object.entries(newPlayers));
        }
        for (let player of newPlayers.values()) {
            if (!currentPlayers.has(player.name)) {
                console.log(player.name);
                newPlayersList.push(player);
            }
        }
        return newPlayersList;
    }
    createCharacterFromCharacterDataI(character) {
        if (character.y >= 400) {
            character.y = 100;
        }
        let createdCharacter = new $Character({
            isPlayerControlled: false,
            x: character.x,
            y: character.y,
            name: character.name || character.username,
            xVelocity: $CharacterVelocity.xVelocity,
            yVelocity: $CharacterVelocity.yVelocity,
            width: character.width,
            height: character.height,
            sprite: new Sprite({
                gameObject: this,
                src: character.sprite.src || "/images/characters/players/erio.png"
            }),
            username: character.username,
            attributes: character.attributes,
            characterGender: character.characterGender,
            player: character.player,
            class: character.class,
            guild: character.guild,
            characterID: character.gameObjectID,
            items: character.items,
            direction: character.direction || "right",
        });
        return createdCharacter;
    }
    addCharacterToOverworld(character, map = MapNames.GrassyField) {
        let clientController = ClientController.ClientControllerInstance;
        let gameObjects = null;
        let selectedMap = clientController.findOverWorldMapByName(map);
        if (selectedMap) {
            gameObjects = selectedMap.GameObjects;
        }
        else {
            console.log("Unable to find map.\nDefaulted user to Grassyfield map. ");
            gameObjects = clientController.findOverWorldMapByName(MapNames.GrassyField).GameObjects;
        }
        gameObjects.forEach((gameObject) => {
            if (gameObject instanceof $Character) {
                if (gameObject.username == character.username) {
                    console.log("Character is already exists in this map.");
                    return;
                }
            }
        });
        gameObjects.push(character);
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
    static syncUsertoCharacter(obj) {
        let char = new $Character({
            isPlayerControlled: true,
            name: obj.username,
            x: Utils.withGrid(6),
            y: Utils.withGrid(6),
            sprite: new Sprite({ src: obj.src || "/images/characters/players/erio.png" }),
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
            location: obj.location || MapNames.GrassyField,
            xVelocity: $CharacterVelocity.xVelocity,
            yVelocity: $CharacterVelocity.yVelocity,
        });
        ClientController.ClientControllerInstance.SETCharacter(char);
        return char;
    }
    serverRequestMoveCharacter(character, moveDirection) {
        let clientController = ClientController.ClientControllerInstance;
        if (character.player == clientController.character.player) {
            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req");
                clientController.moveCharacter(moveDirection, character);
            }
            else {
                clientController.moveCharacter(Direction.STANDSTILL, character);
            }
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
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.UP, gameOBJ);
                }
                break;
            case Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.DOWN, gameOBJ);
                }
                break;
            case Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.LEFT, gameOBJ);
                }
                break;
            case Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.RIGHT, gameOBJ);
                }
                break;
            default:
                clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.STANDSTILL, gameOBJ);
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
                ClientController.ClientControllerInstance.addCharacterToOverworld(character.characterObj);
            }
        });
    }
    emit(event, data = false) {
        if (data)
            ClientController.ClientControllerInstance.socket.emit(event, data);
        ClientController.ClientControllerInstance.socket.emit(event);
        console.log("emitting event: ", event);
    }
    checkMessage(message) {
        let cleanMessage = '';
        if (message) {
            cleanMessage = message;
        }
        try {
            ClientController.ClientControllerInstance.sendMessage(cleanMessage.detail, ClientController.ClientControllerInstance.character.username);
        }
        catch (error) {
            alert('No character selected');
        }
    }
    sendMessage(message, user) {
        if (ClientController.ClientControllerInstance.activeServer) {
            ClientController.ClientControllerInstance.socket.emit($socketRoutes.REQUEST_MESSAGE, this.activeServer, message, user);
            return;
        }
        alert("Select a server to send a message.");
    }
    postMessage(message, username) {
        ClientController.ClientControllerInstance.view.postMessage(message, username);
    }
    async createCharacter(route, data) {
        try {
            console.log("sending data to server -ClientController");
            let characterData = {
                username: data.detail.username,
                characterGender: data.detail.characterGender,
                player: "",
                x: 0,
                y: 0,
                direction: Direction.RIGHT,
                sprite: data.detail.sprite,
                height: $CharacterSize.height,
                width: $CharacterSize.width,
                location: MapNames.GrassyField,
                xVelocity: $CharacterVelocity.xVelocity,
                yVelocity: $CharacterVelocity.yVelocity,
                gameObjectID: 0,
                name: data.detail.name,
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
        this.socket.emit($socketRoutes.REQUEST_CLIENT_LOGOUT, this.clientID, this.character);
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
        }
        else {
            console.log('error');
        }
    }
}
ClientController.ClientControllerInstance;
//# sourceMappingURL=ClientController.js.map