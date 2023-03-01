import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { Direction } from "../app/DirectionInput.js";
import Queue from ".././framework/Queue.js";
export var ClientMapSlot;
(function (ClientMapSlot) {
    ClientMapSlot[ClientMapSlot["ClientSocket"] = 0] = "ClientSocket";
    ClientMapSlot[ClientMapSlot["ClientOBJ"] = 1] = "ClientOBJ";
})(ClientMapSlot || (ClientMapSlot = {}));
export class GameRouter {
    static gameRouter;
    serverRooms = null;
    io;
    moveRequestQue = new Queue();
    moveRequestTimer = 600;
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
    getMoveRequestTimer() {
        return this.moveRequestTimer;
    }
    initGame(_socket, _ip) {
        let gameRouter = GameRouter.GameRouterInstance;
        _socket.on('serverRoomFull', this.serverRoomFull);
        _socket.emit('connected', _ip);
        _socket.on("online", this.playerConnected);
        _socket.on('playerJoinServer', this.playerJoinServer);
        _socket.on('playerLogout', this.playerLogout);
        _socket.on("message", this.checkMessage);
        if (gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ)) {
            if (gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters.at(0))
                _socket.emit('syncPlayer', gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters.at(0));
        }
        _socket.on("moveReq", gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on("characterCreated", gameRouter.addCharacterToOverworld);
        if (this.serverRooms == null) {
            this.serverRooms = [];
            this.createServerRoom();
        }
    }
    checkMessage(message, user) {
        let cleanMessage = '';
        if (message) {
            cleanMessage = message;
        }
        GameRouter.GameRouterInstance.io.emit('globalMessage', cleanMessage, user);
    }
    addCharacterToOverworld(character, overworld = 'grassyfield') {
        let arr = GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].username == character.username) {
                GameRouter.GameRouterInstance.syncOverworld();
                return;
            }
        }
        GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects.push(character);
        console.log(character.username + " added to the overworld");
        GameRouter.GameRouterInstance.syncOverworld();
        return;
    }
    addCharacterMoveRequestsToQueue(characterMovingDirection, characterObject) {
        let queue = GameRouter.GameRouterInstance.getMoveRequestQueue();
        queue.add({
            direction: characterMovingDirection,
            characterObj: characterObject,
        });
        setInterval(() => {
            if (!queue.isEmpty()) {
                GameRouter.GameRouterInstance.moveCharacter(queue);
            }
        }, GameRouter.GameRouterInstance.getMoveRequestTimer());
    }
    moveCharacter(characterMoveRequests) {
        while (!characterMoveRequests.isEmpty()) {
            let currentCharacterMoveRequest = characterMoveRequests.dequeue();
            let delta = {
                x: currentCharacterMoveRequest.characterObj.x,
                y: currentCharacterMoveRequest.characterObj.y,
            };
            switch (currentCharacterMoveRequest.direction) {
                case Direction.UP:
                    delta.y -= 0.5;
                    break;
                case Direction.DOWN:
                    delta.y += 0.5;
                    break;
                case Direction.LEFT:
                    delta.x -= 0.5;
                    break;
                case Direction.RIGHT:
                    delta.x += 0.5;
                    break;
                default:
                    delta;
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
    syncOverworld() {
        let syncedOverworld = GameRouter.GameRouterInstance.copyOverworld();
        console.log("\n" + syncedOverworld);
        GameRouter.GameRouterInstance.io.emit("syncOverworld", syncedOverworld);
        return;
    }
    syncPlayersMovements(charactersMovementData) {
        GameRouter.GameRouterInstance.io.emit("syncPlayersMovements", charactersMovementData);
    }
    copyOverworld() {
        let clientOverworld = Object.assign({}, GameRouter.GameRouterInstance.OverworldMaps);
        return clientOverworld;
    }
    createServerRoom(customId = 0) {
        let gameRouter = GameRouter.GameRouterInstance;
        let playerList = new Array($serverSize.serverSize);
        let _serverId = (customId);
        let server = new Map([[_serverId, playerList]]);
        gameRouter.serverRooms.push(server);
        gameRouter.startServer(_serverId);
    }
    startServer(serverId) {
        let gameRouter = GameRouter.GameRouterInstance;
        console.log('starting server');
        let players = this.serverRooms?.at(0)?.get(0);
        let world = this.createOverworld();
        gameRouter.io.sockets.in(serverId).emit('newServerWorld', world);
    }
    serverRoomFull() {
        console.log("Not implemented");
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
    playerDisconnect(client) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket.emit("offline");
        gameRouter.clientMap.delete(client.id);
    }
    playerLogout() {
        console.log('player logout not implemented - gameRouter');
    }
    createOverworld() {
        console.log('Create overworld not implemented - gameRouter');
    }
}
//# sourceMappingURL=GameRouter.js.map