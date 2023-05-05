import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { Character as $Character } from "../app/Character.js";
import $Queue from ".././framework/Queue.js";
import { MapNames } from "../constants/MapNames.js";
import { Overworld_Server } from "./Overworld_Server.js";
import { MessageHeader as $MessageHeader, Message as $Message } from "../framework/MessageHeader.js";
import $MovementSystem from "../app/MovementSystem.js";
import { ServerMessages as $serverMessages } from "../constants/ServerMessages.js";
import WordFilter from "../app/WordFilter.js";
export var ClientMapSlot;
(function (ClientMapSlot) {
    ClientMapSlot[ClientMapSlot["ClientSocket"] = 0] = "ClientSocket";
    ClientMapSlot[ClientMapSlot["ClientOBJ"] = 1] = "ClientOBJ";
    ClientMapSlot[ClientMapSlot["ClientActiveCharacter"] = 2] = "ClientActiveCharacter";
    ClientMapSlot[ClientMapSlot["ClientInputQue"] = 3] = "ClientInputQue";
})(ClientMapSlot || (ClientMapSlot = {}));
export class GameRouter {
    static gameRouter;
    io;
    moveRequestQue = new $Queue();
    clientMessageQueue = new $Queue();
    moveRequestTimer = 100;
    clientInitMap = new Map();
    client = null;
    clientSocket;
    clientMap = new Map();
    clientIP;
    serverRooms = new Map();
    currentServerTick = 1;
    serverTickRate = 50;
    Overworld = null;
    constructor() {
        this.serverTick();
    }
    static get GameRouterInstance() {
        if (this.gameRouter == null) {
            this.gameRouter = new GameRouter();
        }
        return this.gameRouter;
    }
    setIO(_io) {
        this.io = _io;
    }
    setClient(_client, ip) {
        let gameRouter = GameRouter.GameRouterInstance;
        if (!gameRouter.clientInitMap.has(ip)) {
            gameRouter.clientInitMap.set(ip, _client);
        }
    }
    getClient(ip) {
        let gameRouter = GameRouter.GameRouterInstance;
        if (gameRouter.clientInitMap.has(ip)) {
            return gameRouter.clientInitMap.get(ip);
        }
        return null;
    }
    get ClientIP() {
        return this.clientIP;
    }
    setClientMap(_data, slot) {
        if (this.clientMap.has(_data.id)) {
            switch (slot) {
                case ClientMapSlot.ClientSocket:
                    this.clientMap.get(_data.id)?.setClientSocket(_data.arg);
                    break;
                case ClientMapSlot.ClientOBJ:
                    this.clientMap.get(_data.id)?.setClientOBJ(_data.arg);
                    break;
                case ClientMapSlot.ClientActiveCharacter:
                    this.clientMap.get(_data.id)?.setActiveCharacter(_data.arg);
                    break;
                case ClientMapSlot.ClientInputQue:
                    this.clientMap.get(_data.id)?.addInput(_data.arg.tick, _data.arg.input);
            }
        }
    }
    getClientMap() {
        return this.clientMap;
    }
    setClientSocket(_gameSocket) {
        this.clientSocket = _gameSocket;
    }
    setClientIP(ip) {
        this.clientIP = ip;
    }
    getClientIP() {
        return this.clientIP;
    }
    getMoveRequestQueue() {
        return this.moveRequestQue;
    }
    getMoveRequestIntervalTime() {
        return this.moveRequestTimer;
    }
    initGame(_socket, _ip) {
        let gameRouter = GameRouter.GameRouterInstance;
        this.setClientSocket(_socket);
        _socket.on($socketRoutes.REQUEST_JOIN_SERVER_ROOM, (clientID, serverRoom) => this.playerJoinServer(clientID, serverRoom));
        _socket.on($socketRoutes.REQUEST_CLIENT_LOGOUT, this.playerLogout);
        _socket.on($socketRoutes.REQUEST_MESSAGE, this.checkMessage);
        _socket.on($socketRoutes.REQUEST_OVERWORLD_GAME_OBJECTS, this.updateGameObjects);
        _socket.on($socketRoutes.REQUEST_PING, (id) => { console.log("request from:", id); GameRouter.GameRouterInstance.io.to(id).emit($socketRoutes.RESPONSE_PONG); });
        _socket.on($socketRoutes.REQUEST_CURRENT_TICK, (id) => { console.log("request from:", id); GameRouter.GameRouterInstance.io.to(id).emit($socketRoutes.RESPONSE_CURRENT_TICK, this.currentServerTick); console.log(this.currentServerTick); });
        _socket.on($socketRoutes.REQUEST_CLIENT_ACTION_MESSAGE, (message) => { this.addCharacterActionRequestToQueue(message); });
        _socket.on($socketRoutes.REQUEST_ACTIVE_SERVERS, this.sendServersList);
        _socket.on($socketRoutes.REQUEST_CHARACTER_MOVEMENT, gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, (character, map, clientID) => {
            let implementsInterface = this.implementsCharacterDataInterface(character);
            console.log(implementsInterface);
            let char = null;
            if (implementsInterface) {
                char = {
                    name: character.name,
                    x: character.x,
                    y: character.y,
                    sprite: character.sprite,
                    width: character.width,
                    height: character.height,
                    direction: character.direction,
                    gameObjectID: character.gameObjectID,
                    username: character.username,
                    attributes: character.attributes,
                    class: character.class,
                    guild: character.guild,
                    items: character.items,
                    player: character.player,
                    location: character.location,
                    xVelocity: character.xVelocity,
                    yVelocity: character.yVelocity,
                    friends: character.friends,
                    equipment: character.equipment,
                    characterGender: character.characterGender,
                };
            }
            if (char) {
                gameRouter.clientMap.has(clientID) ? gameRouter.setClientMap({ id: clientID, arg: char }, ClientMapSlot.ClientActiveCharacter) : console.log("Unknown Client");
                console.log("id: ", clientID, " active character: ", gameRouter.clientMap.get(clientID).getActiveCharacter().username);
            }
            gameRouter.addCharacterToOverworld(character, map);
        });
        this.createServerRooms();
        setInterval(() => {
            if (!GameRouter.GameRouterInstance.moveRequestQue.isEmpty()) {
                GameRouter.GameRouterInstance.moveCharacter(GameRouter.GameRouterInstance.moveRequestQue);
            }
        }, GameRouter.GameRouterInstance.getMoveRequestIntervalTime());
    }
    implementsCharacterDataInterface(obj) {
        let atrr, gender, guild, items, x, y, xVelocity, yVelocity, _class, _id, username, player, sprite, friends, equipment, location, height, width, name = false;
        if ("attributes" in obj) {
            atrr = true;
        }
        if ("characterGender" in obj) {
            gender = true;
        }
        if ("class" in obj) {
            _class = true;
        }
        if ("x" in obj) {
            x = true;
        }
        if ("y" in obj) {
            y = true;
        }
        if ("xVelocity" in obj) {
            xVelocity = true;
        }
        if ("yVelocity" in obj) {
            yVelocity = true;
        }
        if ("gameObjectID" in obj) {
            _id = true;
        }
        if ("sprite" in obj) {
            sprite = true;
        }
        if ("username" in obj) {
            username = true;
        }
        if ("friends" in obj) {
            friends = true;
        }
        if ("equipment" in obj) {
            equipment = true;
        }
        if ("player" in obj) {
            player = true;
        }
        if ("location" in obj) {
            location = true;
        }
        if ("name" in obj) {
            name = true;
        }
        if ("height" in obj) {
            height = true;
        }
        if ("width" in obj) {
            width = true;
        }
        if (atrr && gender && _class && x && y && xVelocity && yVelocity && sprite && _id && username && name && friends && equipment && player && location && name && height && width) {
            console.log(`${obj} satisfies characterDataInterface.`);
            return true;
        }
        console.log(`${obj} does not satisfy the interface. It is missing \nname:${name} attributes:${atrr} gender:${gender} class:${_class} x:${x} y:${y} xVelocity:${xVelocity} yVelocity:${yVelocity} sprite:${sprite} id:${_id} username:${username} friends:${friends} equipment:${equipment} player:${player}  location:${location} height:${height}  width:${width}`);
        return false;
    }
    createMessageHeaders() {
        throw new Error("Method not implemented.");
    }
    createMessageHeadersForActiveClients() {
        let serverMessageHeaders = [];
        let tickAdjustments = new Map();
        if (!this.clientMessageQueue.isEmpty()) {
            let que = this.clientMessageQueue.toArray();
            que.forEach((client) => {
                let foundClient = this.getClientMap().get(client.id);
                let foundClientIterationNumb = this.getClientMap().get(client.id).getAdjustmentIteration();
                if (!foundClient) {
                    console.log("No client found.");
                    return;
                }
                if (client.adjustmentIteration != foundClientIterationNumb) {
                    tickAdjustments.set(client.id, foundClientIterationNumb);
                }
            });
        }
        for (let client of this.getClientMap().values()) {
            let id = client.getClientSocket().id;
            if (tickAdjustments.has(id)) {
                let messageHeader = this.createMessageHeader(id, client.getAdjustmentIteration(), null, tickAdjustments.get(id));
                serverMessageHeaders.push({ id: id, messageHeader: messageHeader });
            }
            else {
                let messageHeader = this.createMessageHeader(id, client.getAdjustmentIteration(), null, null);
                serverMessageHeaders.push({ id: id, messageHeader: messageHeader });
            }
        }
        return serverMessageHeaders;
    }
    createMessageHeader(id, adjustmentIteration, content, tickAdjustment) {
        return new $MessageHeader(adjustmentIteration, content, id, tickAdjustment);
    }
    serverTick() {
        setInterval(() => {
            let serverMessageHeaders;
            let serverMessages = new Array();
            while (!this.clientMessageQueue.isEmpty()) {
                serverMessageHeaders = this.createMessageHeadersForActiveClients();
                let messageHeader = this.clientMessageQueue.dequeue();
                let client = this.getClientMap().get(messageHeader.id);
                let clientCharacter = client.getActiveCharacter();
                if (messageHeader.contents.at(0).type == $serverMessages.Movement) {
                    let message;
                    message = messageHeader.contents.at(0);
                    console.log("client action: ", message);
                    if (!message.action) {
                        break;
                    }
                    const { direction, worldWidth, worldHeight, mapMinWidth, mapMinHeight } = message.action;
                    let coords = $MovementSystem.updateCharacterPosition(clientCharacter, direction, worldWidth, worldHeight, mapMinWidth, mapMinHeight);
                    let clientPosition = {
                        username: clientCharacter.username,
                        coords: coords,
                    };
                    serverMessages.push(new $Message($serverMessages.Movement, clientPosition, message.tick, null));
                }
                else {
                }
            }
            if (serverMessageHeaders)
                serverMessageHeaders.forEach((messageHeader) => {
                    let id = null;
                    let header = null;
                    if ((typeof messageHeader.id) == 'string') {
                        id = messageHeader.id;
                    }
                    if (messageHeader.messageHeader instanceof $MessageHeader) {
                        header = messageHeader.messageHeader;
                    }
                    header.updateContents(serverMessages);
                    GameRouter.GameRouterInstance.io.to(id).emit($socketRoutes.RESPONSE_CLIENT_ACTION_MESSAGE, header);
                });
            this.currentServerTick++;
        }, this.serverTickRate);
    }
    checkClientMessagesForIncorrectTickTiming(message) {
        const clientTickAdjustment = 4;
        if (!message) {
            console.log("Something went wrong with receiving the message.");
            return;
        }
        let clientId = message.id;
        if (!this.getClientMap().get(clientId)) {
            console.log("Client does not exist.");
            return;
        }
        let clientTick = message.contents.at(0).tick;
        switch (this.clientsTickChecker(clientTick)) {
            case 1:
                console.log("Message was dropped by the server. Tick was behind schedule. " + "\n client tick:" + clientTick + " server tick: " + this.currentServerTick);
                this.adjustClientsTick((this.currentServerTick + clientTickAdjustment) - clientTick, clientId);
                break;
            case 2:
                console.log("Client is too far ahead of the server." + "\n client tick:" + clientTick + " server tick: " + this.currentServerTick);
                this.adjustClientsTick((this.currentServerTick + clientTickAdjustment) - clientTick, clientId);
                break;
            default:
                console.log("Clients message was received successfully");
        }
    }
    addCharacterActionRequestToQueue(message) {
        this.clientMessageQueue.add(message);
    }
    clientsTickChecker(tick) {
        const clientTickAdjustment = 4;
        if (tick < this.currentServerTick) {
            return 1;
        }
        if (tick > this.currentServerTick + clientTickAdjustment) {
            return 2;
        }
        return 0;
    }
    adjustClientsTick(tickAdjustmentAmount, id) {
        let client = undefined;
        if (!this.getClientMap().has(id)) {
            console.log("Client not found.");
            return;
        }
        client = this.getClientMap().get(id);
        client.incrementAdjustmentIteration();
        client.setAdjustedTick(client.getAdjustmentIteration(), tickAdjustmentAmount);
    }
    sendServersList() {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.io.emit($socketRoutes.RESPONSE_ACTIVE_SERVERS, [...gameRouter.serverRooms]);
    }
    syncOverworld() {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        let syncedOverworld = {
            grassyfield: {
                name: MapNames.GrassyField,
                activePlayers: Object.assign({}, overworld.grassyfield.activePlayers),
                gameObjects: [...overworld.grassyfield.gameObjects],
            },
            hallway: {
                name: MapNames.Hallway,
                activePlayers: Object.assign({}, overworld.hallway.activePlayers),
                gameObjects: [...overworld.hallway.gameObjects],
            }
        };
        console.log("Synced Overworld maps data with client");
        gameRouter.io.emit($socketRoutes.RESPONSE_SYNC_OVERWORLD, syncedOverworld);
    }
    syncPlayersMovements(charactersMovementData) {
        GameRouter.GameRouterInstance.io.emit($socketRoutes.RESPONSE_SYNC_PLAYERS_MOVEMENTS, charactersMovementData);
    }
    createServerRooms() {
        let gameRouter = GameRouter.GameRouterInstance;
        if (!gameRouter.serverRooms.has("US"))
            gameRouter.serverRooms.set("US", "us-1");
        if (!gameRouter.serverRooms.has("EU"))
            gameRouter.serverRooms.set("EU", "eu-1");
        if (!gameRouter.serverRooms.has("ASIA"))
            gameRouter.serverRooms.set("ASIA", "asia-1");
    }
    checkServerRoomCapacity(serverID) {
        let gameRouter = GameRouter.GameRouterInstance;
    }
    serverRoomFull() {
        console.log("Not implemented");
    }
    playerJoinServer(playerID, server) {
        let gameRouter = GameRouter.GameRouterInstance;
        try {
            let socket = gameRouter.clientMap.get(playerID).getClientSocket();
            console.log(`User ${socket.id} joined room ${server}`);
            socket.join(server);
            let room = gameRouter.io.sockets.adapter.rooms.get(server);
            if (room) {
                console.log(`Sockets in ${server}: ` + [...room]);
            }
            else {
                console.log("room doesn't exist");
            }
            gameRouter.io.to(socket.id).emit($socketRoutes.RESPONSE_SERVER_MESSAGE, `Welcome to ${server}`, "Server");
        }
        catch (error) {
            console.log("Error connecting socket to room: " + error);
        }
    }
    playerDisconnect(client, clientIP) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket.emit($socketRoutes.RESPONSE_OFFLINE_CLIENT);
        throw new Error("method not implemented");
    }
    playerLogout(id, character) {
        let gameRouter = GameRouter.GameRouterInstance;
        console.log(`${character.username} has logged out.`);
        gameRouter.clientSocket.emit($socketRoutes.RESPONSE_OFFLINE_CLIENT);
        gameRouter.clientMap.delete(id);
        gameRouter.removeCharacterFromOverworld(character);
    }
    getOverworld() {
        console.log('Overworld created - gameRouter');
        if (GameRouter.GameRouterInstance.Overworld == null || GameRouter.GameRouterInstance.Overworld == undefined) {
            let overworld = GameRouter.GameRouterInstance.Overworld = new Overworld_Server();
            return overworld;
        }
        else {
            return GameRouter.GameRouterInstance.Overworld;
        }
    }
    updateGameObjects(map = MapNames.GrassyField) {
        let gameObjects;
        switch (map) {
            case MapNames.GrassyField:
                gameObjects = GameRouter.GameRouterInstance.getOverworld().grassyfield.gameObjects;
                break;
            case MapNames.Hallway:
                gameObjects = GameRouter.GameRouterInstance.getOverworld().hallway.gameObjects;
                break;
            default:
                gameObjects = GameRouter.GameRouterInstance.getOverworld().grassyfield.gameObjects;
        }
        GameRouter.GameRouterInstance.io.emit($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, gameObjects, map);
    }
    checkMessage(serverRoom, message, user) {
        let gameRouter = GameRouter.GameRouterInstance;
        let cleanMessage = '';
        if (message) {
            let wordFilter = new WordFilter();
            if (wordFilter.isProfane(message)) {
                cleanMessage = wordFilter.replaceProfane(message, '*');
            }
            else {
                cleanMessage = message;
            }
        }
        if (serverRoom.toLocaleLowerCase() == 'global' || serverRoom == '') {
            console.log('Emitting globally.');
            gameRouter.io.emit($socketRoutes.RESPONSE_MESSAGE, cleanMessage, user);
        }
        gameRouter.io.to(serverRoom).emit($socketRoutes.RESPONSE_MESSAGE, cleanMessage, user);
    }
    addCharacterToOverworld(character, overworldMap = MapNames.GrassyField) {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        if (!overworldMap) {
            overworldMap = MapNames.GrassyField;
        }
        if (!overworld.maps.get(overworldMap).activePlayers.has(character.username)) {
            overworld.maps.get(overworldMap).activePlayers.set(character.username, character);
        }
        else {
            gameRouter.syncOverworld();
            return;
        }
        console.log(`${character.username} switched to ${overworldMap} map.`);
        character.location = overworldMap;
        overworld.maps.get(overworldMap).gameObjects.forEach((gameObj, i) => {
            if (gameObj instanceof $Character) {
                if (gameObj.username == character.username) {
                    console.log(`${character.username} already exists in ${overworld.maps.get(overworldMap).name} map gameObjects list.`);
                    return;
                }
            }
        });
        overworld.maps.get(overworldMap).gameObjects.push(character);
        gameRouter.syncOverworld();
    }
    removeCharacterFromOverworld(character) {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        let playerFound = false;
        if (overworld.maps.get(character.location).activePlayers.delete(character.name)) {
            console.log("Character was successfully removed.");
            overworld.maps.get(character.location).gameObjects.forEach((gameObj, i) => {
                if (gameObj instanceof $Character) {
                    if (gameObj.name == character.name) {
                        console.log(overworld.maps.get(character.location).gameObjects.splice(i, 1) + " was successfully removed.");
                    }
                }
            });
        }
        else {
            console.log("Unable to remove character.");
        }
        ;
        gameRouter.syncOverworld();
    }
    addCharacterMoveRequestsToQueue(characterMovingDirection, characterObject) {
        let queue = GameRouter.GameRouterInstance.getMoveRequestQueue();
        queue.add({
            direction: characterMovingDirection,
            characterObj: characterObject,
        });
    }
    moveCharacter(characterMoveRequests) {
    }
}
//# sourceMappingURL=GameRouter.js.map