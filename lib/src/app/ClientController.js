import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, } from "../constants/EventConstants.js";
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { utilFunctions } from "../app/Utils.js";
import { Direction as $Direction } from "./DirectionInput.js";
import { GameMap } from "./GameMap.js";
import { Overworld_Test } from "./Overworld_Test.js";
import { MapNames } from "../constants/MapNames.js";
import { MessageHeader as $MessageHeader, Message as $Message, } from "../framework/MessageHeader.js";
import { CharacterVelocity as $CharacterVelocity, CharacterSize as $CharacterSize, } from "../constants/CharacterAttributesConstants.js";
import Queue from "../framework/Queue.js";
import { ServerMessages } from "../constants/ServerMessages.js";
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
    clientMovementBuffer = new Queue();
    messageHistory = [];
    grassyfieldConfig = {
        gameObjects: new Array(),
        activeCharacters: null,
        name: MapNames.GrassyField,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: "/images/maps/Battleground1.png",
        upperImageSrc: "/images/maps/Battleground1.png",
        element: document.querySelector(".game-container"),
        canvas: document
            .querySelector(".game-container")
            .querySelector(".game-canvas"),
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0,
    };
    hallwayConfig = {
        gameObjects: new Array(),
        activeCharacters: null,
        name: MapNames.Hallway,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: "/images/maps/Battleground2.png",
        upperImageSrc: "/images/maps/Battleground2.png",
        element: document.querySelector(".game-container"),
        canvas: document
            .querySelector(".game-container")
            .querySelector(".game-canvas"),
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0,
    };
    MapManger = new $MapManager();
    MessageManager = new $MessageManager();
    CharacterManager = new $CharacterManager();
    OVERWORLD = null;
    constructor(networkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = "/player/savecharacter";
        this.init();
        this.listenForEvent($events.SELECT_CHARACTER, (e) => {
            ClientController.ClientControllerInstance.characterSelectionCallback(e);
        }, this.view);
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
        this.listenForEvent($events.MESSAGE, (message) => {
            this.sendMessage(message, ClientController.ClientControllerInstance.CharacterManager.Character
                .username);
        }, this.view);
        document.addEventListener("visibilitychange", () => {
            console.log("Visibility state:", document.visibilityState);
            if (document.visibilityState === "visible") {
                if (!this.socket || this.socket.disconnected) {
                    console.log("Reconnecting socket...");
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
        this.socket.on("connect", () => {
            console.log("Socket connected:" + this.socket.id);
            this.setID(this.socket.id);
            ClientController.ClientControllerInstance.getLatency();
            ClientController.ClientControllerInstance.setCurrentTick().then(() => {
                ClientController.ClientControllerInstance.clientTick();
            });
        });
        this.socket.on("disconnect", () => {
            console.log("Socket disconnected");
        });
    }
    async init() {
        this.connectSocket().then(async () => {
            this.socket.on($socketRoutes.RESPONSE_CLIENT_JOINED_SERVER, this.playerJoinedServer);
            this.socket.on($socketRoutes.RESPONSE_DISPLAY_LOADING_SCREEN, () => this.view.toggleLoadingScreen());
            this.socket.on($socketRoutes.RESPONSE_ONLINE_CLIENT, (client) => {
                setTimeout(() => {
                    this.view.toggleLoadingScreen();
                    this.connect(client);
                }, 1000);
            });
            this.socket.on($socketRoutes.RESPONSE_OFFLINE_CLIENT, this.disconnect);
            this.socket.on($socketRoutes.RESPONSE_RECONNECT_CLIENT, () => {
                if (!document.hidden) {
                    window.location.reload();
                }
            });
            this.socket.on($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, (gameObjects, map) => {
                this.updateGameObjects(gameObjects, map);
            });
            this.socket.on($socketRoutes.RESPONSE_SYNC_OVERWORLD, (overworld) => {
                this.syncOverworld(overworld);
            });
            this.socket.on($socketRoutes.RESPONSE_MESSAGE, (message, username) => {
                this.postMessage(message, username);
            });
            this.socket.on($socketRoutes.RESPONSE_SERVER_MESSAGE, (message) => {
                this.postMessage(message, "Server");
            });
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
            setTimeout(() => {
                this.getLatency();
            }, 500);
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
        return new Promise((resolve) => {
            resolve(true);
        });
    }
    adjustCurrentTick(adjustmentAmount, adjustmentIteration) {
        if (adjustmentIteration == this.adjustmentIteration) {
            return;
        }
        this.latency_count += adjustmentAmount;
        this.currentClientTick += adjustmentAmount + this.latency_count;
        this.adjustmentIteration == adjustmentIteration;
        console.log(`current client tick: ${this.currentClientTick}, iteration: ${this.adjustmentIteration}`);
    }
    get CurrentSystemTick() {
        return this.currentClientTick;
    }
    notifyServer(type, _currentDirection, _worldWidth, _worldHeight, _mapMinWidth, _mapMinHeight, tick, skill) {
        let messageCount = 1;
        if (!_currentDirection) {
            _currentDirection = $Direction.STANDSTILL;
        }
        let messageHeader = null;
        switch (type) {
            case ServerMessages.Skill:
                let skillParameters = {
                    action: skill,
                    worldWidth: _worldWidth,
                    worldHeight: _worldHeight,
                    mapMinWidth: _mapMinWidth,
                    mapMinHeight: _mapMinHeight,
                };
                messageHeader = this.createMessage(skillParameters, type, this.adjustmentIteration, messageCount, tick, this.getID());
                break;
            case ServerMessages.Movement:
                let movementParameters = {
                    action: _currentDirection,
                    worldWidth: _worldWidth,
                    worldHeight: _worldHeight,
                    mapMinWidth: _mapMinWidth,
                    mapMinHeight: _mapMinHeight,
                };
                messageHeader = this.createMessage(movementParameters, type, this.adjustmentIteration, messageCount, tick, this.getID());
                break;
        }
        if (!messageHeader) {
            console.log("Failed to create message.");
            return;
        }
        console.log("message being sent: ", messageHeader.contents.at(0), " ", messageHeader.contents.at(0).action);
        this.socket.emit($socketRoutes.REQUEST_CLIENT_ACTION_MESSAGE, messageHeader);
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
    processServerActionMessages(data) {
        let serverMessageHeader = ClientController.ClientControllerInstance.createMessageHeaderAndMessagesFromData(data);
        let messages;
        if (!(serverMessageHeader instanceof $MessageHeader)) {
            console.log("No message header found.", serverMessageHeader);
            return;
        }
        this.messageHistory.push(serverMessageHeader);
        if (serverMessageHeader.adjustmentIteration != this.adjustmentIteration) {
            this.adjustCurrentTick(serverMessageHeader.tickAdjustment, serverMessageHeader.adjustmentIteration);
        }
        messages = serverMessageHeader.contents;
        messages.forEach((message) => {
            if (!(message instanceof $Message)) {
                console.log("Message is not the correct typing.", message);
                return;
            }
            let { username } = message.action;
            if (message.type == ServerMessages.Movement) {
                if (username ==
                    ClientController.ClientControllerInstance.CharacterManager.Character
                        .name) {
                    let predictedPositions = ClientController.ClientControllerInstance.checkInterpolatedPositions(message);
                    if (!predictedPositions) {
                        ClientController.clientController.fixIncorrectPredections(message);
                    }
                    console.log(`Predicted position result for tick: ${message.tick} : ${predictedPositions}.`);
                }
                else {
                    ClientController.ClientControllerInstance.MapManger.moveNonControlledCharactersWithAnimations(message.action);
                }
            }
            if (message.type == ServerMessages.Skill) {
            }
        });
    }
    setInputHistory(position, tick) {
        let predictedPosition = {
            location: {
                x: position.x,
                y: position.y,
            },
            tick: tick,
            confirmedPosition: false,
        };
        ClientController.ClientControllerInstance.CharacterManager.InputHistory.set(tick, predictedPosition);
    }
    createMessageHeaderAndMessagesFromData(data) {
        let messageArray = [];
        if (data.contents && Array.isArray(data.contents)) {
            console.log("Converting object into Message.");
            for (let message of data.contents) {
                messageArray.push(new $Message(message.type, message.action, message.tick, message.id));
            }
        }
        else {
            console.log("Unable to convert object into Message.");
            return null;
        }
        let messageHeader = new $MessageHeader(data.adjustmentIteration, messageArray, data.id, data.tickAdjustment);
        return messageHeader;
    }
    checkInterpolatedPositions(serverMessage) {
        console.log("Check interpolated positions.");
        if (!(serverMessage instanceof $Message)) {
            console.log("Message is not the correct type. " + typeof serverMessage);
            return false;
        }
        if (!ClientController.ClientControllerInstance.CharacterManager.InputHistory.has(serverMessage.tick)) {
            console.log("Tick was not found in input history.");
            let x = serverMessage.action.coords.x;
            let y = serverMessage.action.coords.y;
            let tick = serverMessage.tick;
            let input = {
                location: { x, y },
                tick: tick,
                confirmedPosition: true,
            };
            ClientController.ClientControllerInstance.CharacterManager.InputHistory.set(serverMessage.tick, input);
            console.log("Tick was added to input history.");
            return true;
        }
        let inputHistory;
        inputHistory =
            ClientController.ClientControllerInstance.CharacterManager.InputHistory.get(serverMessage.tick);
        let { coords } = serverMessage.action;
        if (coords.x == inputHistory.location.x &&
            coords.y == inputHistory.location.y) {
            inputHistory.confirmedPosition = true;
            return true;
        }
        return false;
    }
    fixIncorrectPredections(message) {
        console.log("Fixing incorrect predicted position.");
        let inputHistory;
        inputHistory =
            ClientController.ClientControllerInstance.CharacterManager.InputHistory.get(message.tick);
        let x = message.action.coords.x;
        let y = message.action.coords.y;
        let pos = { x, y };
        console.log(`Prediction: x:${inputHistory.location.x} | y:${inputHistory.location.y} : Actual: x:${x} | y:${y}.`);
        inputHistory.location = pos;
        inputHistory.confirmedPosition = true;
        ClientController.ClientControllerInstance.CharacterManager.Character.x = x;
        ClientController.ClientControllerInstance.CharacterManager.Character.y = y;
        ClientController.ClientControllerInstance.MapManger.updateCharacterPositionViaServerREQ(ClientController.ClientControllerInstance.CharacterManager.Character, x, y);
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
        console.log("Selected-character being sent to the server: ", characterOBJ);
        clientController.socket.emit($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, characterOBJ, characterOBJ.location, clientController.clientID);
        if (clientController.CharacterManager.Character.location == null) {
            clientController.CharacterManager.Character.location =
                MapNames.GrassyField;
        }
        if (clientController.CharacterManager.Character.unlockedSkills.length == 0) {
            clientController.CharacterManager.addCharacterBasicSkills();
            clientController.CharacterManager.addBasicSkillsToHotBar();
            console.log("Client controller: ", clientController.CharacterManager.Character);
            clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_UPDATE, this.clientID, clientController.CharacterManager.Character);
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
        console.log("Starting new Oveworld map: " + startMap);
        clientController.MapManger.startOverWorld(startMap);
    }
    updateGameObjects(gameObjects, updatedMap) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.MapManger.updateGameObjects(gameObjects, updatedMap);
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
        let convertedOverWorld = Object.assign({}, overworld);
        convertedOverWorld.grassyfield.activePlayers = utilFunctions.objectToMap(overworld.grassyfield.activePlayers);
        convertedOverWorld.hallway.activePlayers = utilFunctions.objectToMap(overworld.hallway.activePlayers);
        clientController.MapManger.syncOverworld(convertedOverWorld, clientController.CharacterManager);
    }
    findRecentlyAddedCharacters(currentPlayers, newPlayers) {
        let newPlayersList = new Array();
        console.log("newPlayers: ", newPlayers, " Type: ", typeof newPlayers);
        if (typeof newPlayers === "object" && !(newPlayers instanceof Map)) {
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
    emit(event, data = false) {
        if (data)
            ClientController.ClientControllerInstance.socket.emit(event, data);
        ClientController.ClientControllerInstance.socket.emit(event);
        console.log("emitting event: ", event);
    }
    checkMessage(message) {
        return ClientController.ClientControllerInstance.MessageManager.checkMessage(message);
    }
    sendMessage(message, user) {
        if (ClientController.ClientControllerInstance.activeServer) {
            ClientController.ClientControllerInstance.MessageManager.sendMessage(message.detail, user, this.socket, ClientController.ClientControllerInstance.activeServer);
            return;
        }
        alert("Select a server to send a message.");
    }
    postMessage(message, username) {
        let cleanMessage = ClientController.clientController.MessageManager.checkMessage(message, "");
        ClientController.ClientControllerInstance.view.postMessage(cleanMessage, username);
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
    disconnect(client) {
        console.log("disconnected client", client);
        let result = utilFunctions.checkIfObjectMeetsCharacterDataInterface(client);
        if (result) {
            console.log(`User: ${client.username} is offline.`);
            ClientController.ClientControllerInstance.MapManger.removeCharacterFromMap(client);
        }
    }
    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }
    async playerLogout() {
        this.socket.emit($socketRoutes.REQUEST_CLIENT_LOGOUT, ClientController.ClientControllerInstance.socket.id);
        let response = await this.networkProxy.postJSON("/player/logout", null);
        if (response.ok) {
            console.log("Logged out");
            window.location.reload();
        }
        else {
            console.log("error");
        }
    }
}
ClientController.ClientControllerInstance;
//# sourceMappingURL=ClientController.js.map