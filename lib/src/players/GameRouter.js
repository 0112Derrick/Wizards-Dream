import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
export var ClientMapSlot;
(function (ClientMapSlot) {
    ClientMapSlot[ClientMapSlot["ClientSocket"] = 0] = "ClientSocket";
    ClientMapSlot[ClientMapSlot["ClientOBJ"] = 1] = "ClientOBJ";
})(ClientMapSlot || (ClientMapSlot = {}));
export class GameRouter {
    static gameRouter;
    serverRooms = null;
    io;
    client = null;
    clientSocket;
    clientMap = new Map();
    clientIP;
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
    setClient(_client) {
        this.client = _client;
    }
    get ClientMap() {
        return this.clientMap;
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
    setClientSocket(_gameSocket) {
        this.clientSocket = _gameSocket;
    }
    setClientIP(ip) {
        this.clientIP = ip;
    }
    initGame(_gameSocket) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket = _gameSocket;
        if (!this.clientIP == _gameSocket.handshake.headers.host)
            this.setClientIP(_gameSocket.handshake.headers.host);
        console.log('ip: ', this.clientIP);
        if (gameRouter.clientMap.has(this.clientIP)) {
            this.clientSocket = gameRouter.clientMap.get(this.clientIP)?.at(ClientMapSlot.ClientSocket);
            if (gameRouter.clientMap.get(this.clientIP)?.at(ClientMapSlot.ClientOBJ)) {
                this.client = gameRouter.clientMap.get(this.clientIP)?.at(ClientMapSlot.ClientOBJ);
            }
        }
        else {
            let mapArr = [_gameSocket];
            gameRouter.clientMap.set(this.clientIP, mapArr);
        }
        gameRouter.clientSocket.on('createServerRoom', this.createServerRoom);
        gameRouter.clientSocket.on('serverRoomFull', this.serverRoomFull);
        gameRouter.clientSocket.emit('connected', gameRouter.clientIP);
        gameRouter.clientSocket.on("online", this.playerConnected);
        gameRouter.clientSocket.on('playerJoinServer', this.playerJoinServer);
        gameRouter.clientSocket.on('playerLogout', this.playerLogout);
        if (this.serverRooms == null) {
            this.serverRooms = [];
            this.createServerRoom();
        }
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
        let world = this.createOverworld([...players]);
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
    createOverworld(playerList) {
        console.log('Create overworld not implemented - gameRouter');
    }
}
//# sourceMappingURL=GameRouter.js.map