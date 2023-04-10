import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { Character as $Character } from "../app/Character.js";
import Queue from ".././framework/Queue.js";
import { MapNames } from "../constants/MapNames.js";
import { Overworld_Server } from "./Overworld_Server.js";
export var ClientMapSlot;
(function (ClientMapSlot) {
    ClientMapSlot[ClientMapSlot["ClientSocket"] = 0] = "ClientSocket";
    ClientMapSlot[ClientMapSlot["ClientOBJ"] = 1] = "ClientOBJ";
    ClientMapSlot[ClientMapSlot["ClientActiveCharacter"] = 2] = "ClientActiveCharacter";
})(ClientMapSlot || (ClientMapSlot = {}));
export class GameRouter {
    static gameRouter;
    io;
    moveRequestQue = new Queue();
    moveRequestTimer = 100;
    clientInitMap = new Map();
    client = null;
    clientSocket;
    clientMap = new Map();
    clientIP;
    serverRooms = new Map();
    currentServerTick = 1;
    serverTickRate = 20 / 1000;
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
                    this.clientMap.get(_data.id)?.splice(0, 1, _data.arg);
                    break;
                case ClientMapSlot.ClientOBJ:
                    this.clientMap.get(_data.id)?.splice(1, 1, _data.arg);
                    break;
                case ClientMapSlot.ClientActiveCharacter:
                    this.clientMap.get(_data.id)?.splice(2, 1, _data.arg);
                    break;
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
        _socket.on($socketRoutes.REQUEST_PING, () => { _socket.emit($socketRoutes.RESPONSE_PONG); });
        _socket.on($socketRoutes.REQUEST_ACTIVE_SERVERS, this.sendServersList);
        _socket.on($socketRoutes.REQUEST_CHARACTER_MOVEMENT, gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, (character, map, clientID) => {
            gameRouter.clientMap.has(clientID) ? gameRouter.setClientMap({ id: clientID, arg: character }, ClientMapSlot.ClientActiveCharacter) : console.log("Unknown Client");
            gameRouter.addCharacterToOverworld(character, map);
        });
        this.createServerRooms();
        setInterval(() => {
            if (!GameRouter.GameRouterInstance.moveRequestQue.isEmpty()) {
                GameRouter.GameRouterInstance.moveCharacter(GameRouter.GameRouterInstance.moveRequestQue);
            }
        }, GameRouter.GameRouterInstance.getMoveRequestIntervalTime());
    }
    serverTick() {
        setInterval(() => {
            this.currentServerTick++;
        }, this.serverTickRate);
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
            let socket = gameRouter.clientMap.get(playerID).at(ClientMapSlot.ClientSocket);
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
            cleanMessage = message;
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