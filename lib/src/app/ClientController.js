import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events } from '../constants/EventConstants.js';
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { Character as $Character } from "../app/Character.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { GameMap } from "./GameMap.js";
import { Overworld_Test } from "./Overworld_Test.js";
import { MapNames } from "../constants/MapNames.js";
import { MessageHeader as $MessageHeader, Message as $Message } from "../framework/MessageHeader.js";
import { CharacterVelocity as $CharacterVelocity, CharacterSize as $CharacterSize } from "../constants/CharacterAttributesConstants.js";
import Queue from "../framework/Queue.js";
import { ServerMessages } from '../constants/ServerMessages.js';
import $MapManager from "./MapManager.js";
import $CharacterManager from "./CharacterManager.js";
import $MessageManager from "./MessageManager.js";
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
    clientTickRate = 50;
    currentClientTick = 1;
    client_server_latency = 0;
    latency_count = 3;
    adjustmentIteration = 0;
    clientInputHistory = new Map();
    clientMovementBuffer = new Queue();
    messageHistory = [];
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
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0
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
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0
    };
    MapManger = new $MapManager();
    MessageManager = new $MessageManager();
    CharacterManager = new $CharacterManager();
    OVERWORLD = null;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.init();
        this.listenForEvent($events.SELECT_CHARACTER, (e) => { ClientController.ClientControllerInstance.characterSelectionCallback(e); }, this.view);
        this.listenForEvent($events.CHARACTER_CREATE, async (e) => {
            let result = null;
            console.log("Processing...");
            result = await this.createCharacter(CharacterCreateRoute, e);
            if (result) {
                alert("Character created successfully.");
            }
            else {
                alert("Failed to create character.");
            }
        }, this.view);
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
            this.setID(this.socket.id);
            ClientController.ClientControllerInstance.getLatency();
            ClientController.ClientControllerInstance.setCurrentTick().then(() => { ClientController.ClientControllerInstance.clientTick(); });
        });
        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }
    async init() {
        this.connectSocket().then(async () => {
            this.socket.on($socketRoutes.RESPONSE_CLIENT_JOINED_SERVER, this.playerJoinedServer);
            this.socket.on($socketRoutes.RESPONSE_ONLINE_CLIENT, (client) => { this.connect(client); });
            this.socket.on($socketRoutes.RESPONSE_OFFLINE_CLIENT, this.disconnect);
            this.socket.on($socketRoutes.RESPONSE_RECONNECT_CLIENT, () => {
                if (!document.hidden) {
                    window.location.reload();
                }
            });
            this.socket.on($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, (gameObjects, map) => {
                this.updateGameObjects(gameObjects, map);
            });
            this.socket.on($socketRoutes.RESPONSE_SYNC_OVERWORLD, (overworld) => { this.syncOverworld(overworld); });
            this.socket.on($socketRoutes.RESPONSE_SYNC_PLAYERS_MOVEMENTS, (charactersMovementData) => { this.syncPlayersMovements(charactersMovementData); });
            this.socket.on($socketRoutes.RESPONSE_MESSAGE, (message, username) => { this.postMessage(message, username); });
            this.socket.on($socketRoutes.RESPONSE_SERVER_MESSAGE, (message) => { this.postMessage(message, 'Server'); });
            this.socket.on($socketRoutes.RESPONSE_CLIENT_ACTION_MESSAGE, (messages) => {
                this.processServerActionMessages(messages);
            });
            this.socket.on($socketRoutes.RESPONSE_ACTIVE_SERVERS, (servers) => {
                this.receiveActiveServers(servers);
            });
        });
    }
    getLatency() {
        if (this.getID()) {
            let startTime;
            startTime = Date.now();
            this.socket.emit($socketRoutes.REQUEST_PING, this.clientID);
            this.socket.on($socketRoutes.RESPONSE_PONG, () => {
                const rtt = Date.now() - startTime;
                this.client_server_latency = rtt;
                console.log(`Round Trip time: ${rtt} ms`);
            });
        }
        else {
            setTimeout(() => { this.getLatency(); }, 500);
        }
    }
    getID() {
        if (this.clientID != "")
            return this.clientID;
        throw new Error("ID not set");
    }
    setCurrentTick() {
        console.log("Getting current tick ", Date.now());
        this.socket.emit($socketRoutes.REQUEST_CURRENT_TICK, this.clientID);
        console.log("id: ", this.clientID);
        this.socket.on($socketRoutes.RESPONSE_CURRENT_TICK, (tick) => {
            console.log("server tick: ", tick);
            this.currentClientTick = tick + this.latency_count;
            if (this.client_server_latency >= 16) {
                this.currentClientTick++;
                this.latency_count++;
            }
            console.log("client tick: ", this.currentClientTick);
        });
        return new Promise((resolve) => { resolve(true); });
    }
    adjustCurrentTick(adjustmentAmount, adjustmentIteration) {
        if (adjustmentIteration == this.adjustmentIteration) {
            return;
        }
        this.currentClientTick += adjustmentAmount;
        this.latency_count += adjustmentAmount;
        this.adjustmentIteration == adjustmentIteration;
        console.log(`current client tick: ${this.currentClientTick}, iteration: ${this.adjustmentIteration}`);
    }
    notifyServer(type, currentDirection) {
        let messageCount = 1;
        switch (type) {
            case ServerMessages.Attack:
                break;
            case ServerMessages.Movement:
                let message = this.createMessage(currentDirection, type, this.adjustmentIteration, messageCount, this.currentClientTick, this.getID());
                if (!message) {
                    return;
                }
                this.socket.emit($socketRoutes.REQUEST_CLIENT_ACTION_MESSAGE, message);
                break;
        }
        throw new Error("Method not implemented.");
    }
    createMessage(action, type, adjustmentIteration, messageCount, tick, id) {
        if (!id) {
            console.log("Socket connection not established.");
            return null;
        }
        let message = new $Message(type, action, tick, id);
        let clientMessage = new $MessageHeader(adjustmentIteration, message, id);
        this.messageHistory.push(clientMessage);
        return clientMessage;
    }
    clientTick() {
        setInterval(() => {
            this.currentClientTick++;
        }, this.clientTickRate);
    }
    processServerActionMessages(serverMessageHeader) {
        let messages;
        if (!(serverMessageHeader instanceof $MessageHeader)) {
            console.log("No message header found.");
            return;
        }
        this.messageHistory.push(serverMessageHeader);
        if (serverMessageHeader.adjustmentIteration != this.adjustmentIteration) {
            this.adjustCurrentTick(serverMessageHeader.tickAdjustment, serverMessageHeader.adjustmentIteration);
        }
        messages = serverMessageHeader.contents;
        messages.forEach((message) => {
            let [name, action] = message.action;
            if (name == this.character.name) {
                this.checkInterpolatedPositions(message);
            }
        });
    }
    checkInterpolatedPositions(serverMessage) {
        if (!(serverMessage instanceof $Message)) {
            console.log("Message is not the correct type. " + typeof (serverMessage));
            return;
        }
        if (!this.clientInputHistory.has(serverMessage.tick)) {
            console.log("Tick was not added to input history.");
            return;
        }
        let inputHistory;
        inputHistory = this.clientInputHistory.get(serverMessage.tick);
        let [name, position] = serverMessage.action;
        if (position.x == inputHistory.location.x && position.y == inputHistory.location.y) {
            inputHistory.confirmedPosition = true;
        }
        else {
        }
    }
    fixIncorrectPredections() {
    }
    get Character() {
        return this.character;
    }
    SETCharacter(char) {
        this.character = char;
    }
    setID(id) {
        console.log("ID has been changed to: ", id);
        this.clientID = id;
    }
    connect(_client) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.createOverworld();
        clientController.client = _client;
        console.log(`User: ${clientController.client.username} is online. \n`);
        this.socket.emit($socketRoutes.REQUEST_CLIENT_ONLINE, this.clientID);
        clientController.characters = clientController.client.characters;
        this.CharacterManager.setListOfCharacter(clientController.client.characters);
        clientController.sendViewCharacterSelection(this.CharacterManager.getListOfCharacters());
        clientController.startOverworldOnConnection();
    }
    sendViewCharacterSelection(ListOfCharacters) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.view.createCharacterSelectionButtons(ListOfCharacters);
    }
    characterSelectionCallback(data) {
        let clientController = ClientController.ClientControllerInstance;
        let characterPosition = data.detail;
        let char = clientController.CharacterManager.selectCharacterByIndex(characterPosition);
        let characterOBJ = clientController.CharacterManager.syncUsertoCharacter(char);
        console.log(`User: ${clientController.client.username} is playing on ${clientController.CharacterManager.Character.username}`);
        clientController.socket.emit($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, characterOBJ, characterOBJ.location, clientController.clientID);
        if (clientController.CharacterManager.Character.location == null) {
            clientController.CharacterManager.Character.location = MapNames.GrassyField;
        }
        clientController.MapManger.setClientsCharacterOnMap(clientController.CharacterManager.Character, clientController.CharacterManager.Character.location);
        clientController.MapManger.addCharacterToOverworld(clientController.CharacterManager.Character, clientController.CharacterManager.Character.location);
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
        clientController.socket.emit("requestOverworldGameObjects", startMap);
        console.log('Starting new Oveworld map: ' + startMap);
        this.MapManger.startOverWorld(startMap);
    }
    updateGameObjects(gameObjects, updatedMap) {
        this.MapManger.updateGameObjects(gameObjects, updatedMap);
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
        clientController.MapManger.changeGameMap(map);
    }
    syncOverworld(overworld) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.MapManger.syncOverworld(overworld, clientController.CharacterManager);
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
        let createdCharacter = ClientController.ClientControllerInstance.CharacterManager.createCharacterFromCharacterDataI(character);
        return createdCharacter;
    }
    addCharacterToOverworld(character, map = MapNames.GrassyField) {
        ClientController.ClientControllerInstance.MapManger.addCharacterToOverworld(character, map);
    }
    findOverWorldMapByName(searchingMap) {
        return ClientController.ClientControllerInstance.MapManger.findOverworldMapByName(searchingMap);
    }
    syncUsertoCharacter(obj) {
        let char = ClientController.ClientControllerInstance.CharacterManager.syncUsertoCharacter(obj);
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
                clientController.moveCharacter($Direction.STANDSTILL, character);
            }
        }
    }
    moveCharacter(direction, gameOBJ) {
        let clientController = ClientController.ClientControllerInstance;
        switch (direction) {
            case $Direction.UP:
                if (gameOBJ.y - 0.5 <= 10) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.UP, gameOBJ);
                }
                break;
            case $Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.DOWN, gameOBJ);
                }
                break;
            case $Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.LEFT, gameOBJ);
                }
                break;
            case $Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                }
                else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.RIGHT, gameOBJ);
                }
                break;
            default:
                clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.STANDSTILL, gameOBJ);
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
                direction: $Direction.RIGHT,
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
                return new Promise((resolve) => {
                    resolve(true);
                });
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