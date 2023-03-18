import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { Character } from "../app/Character.js";
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
    server = null;
    io;
    moveRequestQue = new Queue();
    moveRequestTimer = 100;
    clientInitMap = new Map();
    client = null;
    clientSocket;
    clientMap = new Map();
    clientIP;
    Overworld = null;
    constructor() {
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
        _socket.on('serverRoomFull', this.serverRoomFull);
        _socket.on("online", this.playerConnected);
        _socket.on('playerJoinServer', this.playerJoinServer);
        _socket.on('playerLogout', this.playerLogout);
        _socket.on("message", this.checkMessage);
        _socket.on("requestOverworld", this.startServerRoom);
        _socket.on("requestOverworldGameObjects", this.updateGameObjects);
        _socket.on("moveReq", gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on("characterCreated", (character, map, clientID) => {
            gameRouter.clientMap.has(clientID) ? gameRouter.setClientMap({ id: clientID, arg: character }, ClientMapSlot.ClientActiveCharacter) : console.log("Unknown Client");
            gameRouter.addCharacterToOverworld(character, map);
        });
        if (GameRouter.GameRouterInstance.server == null) {
            this.server = new Map();
            this.createServerRoom();
        }
        setInterval(() => {
            if (!GameRouter.GameRouterInstance.moveRequestQue.isEmpty()) {
                GameRouter.GameRouterInstance.moveCharacter(GameRouter.GameRouterInstance.moveRequestQue);
            }
        }, GameRouter.GameRouterInstance.getMoveRequestIntervalTime());
    }
    syncOverworld() {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        let syncedOverworld = {
            grassyfield: {
                name: MapNames.GrassyField,
                activePlayers: Object.assign({}, overworld.grassyfield.activePlayers),
                gameObjects: Object.assign({}, overworld.grassyfield.gameObjects),
            },
            hallway: {
                name: MapNames.Hallway,
                activePlayers: Object.assign({}, overworld.hallway.activePlayers),
                gameObjects: Object.assign({}, overworld.hallway.gameObjects),
            }
        };
        console.log("Synced Overworld maps data with client");
        gameRouter.io.emit("syncOverworld", syncedOverworld);
    }
    syncPlayersMovements(charactersMovementData) {
        GameRouter.GameRouterInstance.io.emit("syncPlayersMovements", charactersMovementData);
    }
    createServerRoom(customId = 0) {
        let gameRouter = GameRouter.GameRouterInstance;
        let serverRoom = new Array($serverSize.serverSize);
        if (gameRouter.server.size > customId) {
            customId = gameRouter.server.size + 1;
        }
        let _serverId = customId;
        gameRouter.server.set(_serverId, serverRoom);
        gameRouter.startServerRoom(_serverId);
    }
    checkServerRoomCapacity(serverID) {
        let gameRouter = GameRouter.GameRouterInstance;
        if (gameRouter.server.has(serverID)) {
            return gameRouter.server.get(serverID).length;
        }
        else {
            return null;
        }
    }
    startServerRoom(serverId) {
        if (!serverId) {
            serverId = 0;
        }
        let gameRouter = GameRouter.GameRouterInstance;
        console.log('starting server');
        let playerList;
        if (gameRouter.server.has(serverId)) {
            playerList = gameRouter.server.get(serverId);
        }
        else {
            playerList = null;
        }
    }
    serverRoomFull() {
        console.log("Not implemented");
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.server.forEach(serverRoom => {
            if (serverRoom.findIndex(null) != -1) {
                console.log(serverRoom.findIndex(null));
            }
            else {
                console.log("create a new server room");
            }
        });
        throw new Error("Method not implemented");
    }
    playerJoinServer(data) {
        let gameRouter = GameRouter.GameRouterInstance;
        this.clientIP = data.id;
        if (!(gameRouter.clientMap.has(this.clientIP))) {
            console.log("client does not exist - gameRouter");
            return;
        }
        gameRouter.clientSocket = gameRouter.clientMap.get(this.clientIP)?.at(ClientMapSlot.ClientSocket);
        console.log('ip (gameRouter - join server): ', gameRouter.ClientIP);
        let room = gameRouter.clientSocket.rooms['/' + data.serverRoom];
        console.log(data.id + data.serverRoom);
        gameRouter.clientSocket.join(data.serverRoom);
        gameRouter.io.sockets.in(data.serverRoom).emit('playerJoinedServer', data);
    }
    playerConnected(id) {
        console.log("player connected called - gameRouter");
        let gameRouter = GameRouter.GameRouterInstance;
    }
    playerDisconnect(client, clientIP) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket.emit("offline");
        gameRouter.clientMap.delete(client.id);
        gameRouter.removeCharacterFromOverworld(client.characters.at(0));
    }
    playerLogout(client) {
        let gameRouter = GameRouter.GameRouterInstance;
        console.log('player logout not implemented - gameRouter');
        gameRouter.clientSocket.emit("offline");
        gameRouter.clientMap.delete(client.id);
        gameRouter.removeCharacterFromOverworld(client.characters.at(0));
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
        GameRouter.GameRouterInstance.io.emit('updatedGameObjects', gameObjects, map);
    }
    checkMessage(message, user) {
        let cleanMessage = '';
        if (message) {
            cleanMessage = message;
        }
        GameRouter.GameRouterInstance.io.emit('globalMessage', cleanMessage, user);
    }
    addCharacterToOverworld(character, overworldMap = MapNames.GrassyField) {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        overworld.maps.get(overworldMap).activePlayers.set(character.name, character);
        console.log(`${character.name} switched to ${overworldMap} map.`);
        character.location = overworldMap;
        overworld.maps.get(overworldMap).gameObjects.forEach((gameObj, i) => {
            if (gameObj instanceof Character) {
                if (gameObj.name == character.name) {
                    console.log(`${character.name} already exists in ${overworld.maps.get(overworldMap).name} map gameObjects list.`);
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
                if (gameObj instanceof Character) {
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