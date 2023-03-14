import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { Character } from "../app/Character.js";
import { Direction } from "../app/DirectionInput.js";
import Queue from ".././framework/Queue.js";
import { MovementContants } from "../constants/Constants.js";
import { MapNames } from "../constants/MapNames.js";
export var ClientMapSlot;
(function (ClientMapSlot) {
    ClientMapSlot[ClientMapSlot["ClientSocket"] = 0] = "ClientSocket";
    ClientMapSlot[ClientMapSlot["ClientOBJ"] = 1] = "ClientOBJ";
})(ClientMapSlot || (ClientMapSlot = {}));
class Overworld_Server {
    maps;
    constructor() {
        this.maps = [];
        this.maps.push(MapNames.GrassyField);
        this.maps.push(MapNames.Hallway);
    }
    grassyfield = {
        name: MapNames.GrassyField,
        activePlayers: [],
        gameObjects: [],
        lowerSrc: '/images/maps/Battleground1.png',
        upperSrc: '/images/maps/Battleground1.png',
    };
    hallway;
}
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
    OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    };
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
        _socket.on("moveReq", gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on("characterCreated", gameRouter.addCharacterToOverworld);
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
        let syncedOverworld = GameRouter.GameRouterInstance.copyOverworld();
        console.log("\n" + syncedOverworld);
        GameRouter.GameRouterInstance.io.emit("syncOverworld", syncedOverworld);
        return;
    }
    copyOverworld() {
        if (GameRouter.GameRouterInstance.Overworld != null) {
            let clientOverworld = Object.assign({}, GameRouter.GameRouterInstance.Overworld);
            return clientOverworld;
        }
        else {
            return Object.assign({}, GameRouter.GameRouterInstance.getOverworld());
        }
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
        let world = this.getOverworld();
        GameRouter.GameRouterInstance.io.emit('newServerWorld', world);
        console.log("Sent newServerWorld.\n" + world);
        setTimeout(() => {
            this.startOverworld();
        }, 1000);
    }
    startOverworld() {
        GameRouter.GameRouterInstance.io.emit('startOverworld');
        console.log("Sent startOverworld.");
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
        let activeCharacters = null;
        switch (overworldMap) {
            case MapNames.GrassyField:
                activeCharacters = overworld.grassyfield.activePlayers;
                for (let i = 0; i < activeCharacters.length; i++) {
                    if (character.name == activeCharacters[i].name) {
                        gameRouter.syncOverworld();
                        return;
                    }
                }
                activeCharacters.push(character);
                overworld.grassyfield.gameObjects.push(character);
                console.log(character.username + " was added to overworld map grassyfield - server");
                break;
            case MapNames.Hallway:
                activeCharacters = overworld.hallway.activePlayers;
                for (let i = 0; i < activeCharacters.length; i++) {
                    if (character.name == activeCharacters[i].name) {
                        gameRouter.syncOverworld();
                        return;
                    }
                }
                activeCharacters.push(character);
                overworld.hallway.gameObjects.push(character);
                console.log(character.username + " was added to overworld map hallway - server");
                break;
        }
        gameRouter.syncOverworld();
    }
    removeCharacterFromOverworld(character) {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        let playerFound = false;
        overworld.grassyfield.activePlayers.forEach((activeCharacter, i) => {
            if (character.name == activeCharacter.name) {
                console.log(overworld.grassyfield.activePlayers.splice(i, 1) + " was removed.");
                playerFound = true;
            }
        });
        if (playerFound) {
            overworld.grassyfield.gameObjects.forEach((gameObject, i) => {
                if (gameObject instanceof (Character)) {
                    if (character.name == gameObject.name) {
                        overworld.grassyfield.gameObjects.splice(i, 1);
                    }
                }
            });
        }
        else {
            overworld.hallway.activePlayers.forEach((activeCharacter, i) => {
                if (character.name == activeCharacter.name) {
                    console.log(overworld.hallway.activePlayers.splice(i, 1) + " was removed.");
                    playerFound = true;
                }
            });
            if (playerFound) {
                overworld.hallway.gameObjects.forEach((gameObject, i) => {
                    if (gameObject instanceof (Character)) {
                        if (character.name == gameObject.name) {
                            overworld.hallway.gameObjects.splice(i, 1);
                        }
                    }
                });
            }
        }
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
        while (!characterMoveRequests.isEmpty()) {
            let currentCharacterMoveRequest = characterMoveRequests.dequeue();
            let delta = {
                x: currentCharacterMoveRequest.characterObj.x,
                y: currentCharacterMoveRequest.characterObj.y,
            };
            const updateDelta = {
                x: MovementContants.West_East,
                y: MovementContants.North_South,
            };
            switch (currentCharacterMoveRequest.direction) {
                case Direction.UP:
                    delta.y -= updateDelta.y;
                    break;
                case Direction.DOWN:
                    delta.y += updateDelta.y;
                    break;
                case Direction.LEFT:
                    delta.x -= updateDelta.x;
                    break;
                case Direction.RIGHT:
                    delta.x += updateDelta.x;
                    break;
                default:
                    break;
            }
            let gameObjectsArray = GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects;
            gameObjectsArray.forEach(char => {
                if (char.username == currentCharacterMoveRequest.characterObj.username) {
                    char.x = delta.x;
                    char.y = delta.y;
                }
                GameRouter.GameRouterInstance.copyOverworld();
            });
            let characterDeltas = [];
            characterDeltas.push({
                characterObj: currentCharacterMoveRequest.characterObj,
                delta: {
                    x: delta.x,
                    y: delta.y,
                },
                direction: currentCharacterMoveRequest.direction,
            });
            GameRouter.GameRouterInstance.syncPlayersMovements(characterDeltas);
        }
    }
}
//# sourceMappingURL=GameRouter.js.map