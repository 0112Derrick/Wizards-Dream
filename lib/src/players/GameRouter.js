import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
export class GameRouter {
    io;
    gameSocket;
    serverRooms = null;
    static gameRouter;
    clientMap = new Map();
    clientID;
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
    setClientSocket(_gameSocket) {
        this.gameSocket = _gameSocket;
    }
    initGame(_io, _gameSocket) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.io = _io;
        gameRouter.gameSocket = _gameSocket;
        gameRouter.clientMap.set(_gameSocket.id, _gameSocket);
        this.clientID = _gameSocket.id;
        gameRouter.gameSocket.emit('connected', gameRouter.clientID);
        gameRouter.gameSocket.emit('online', gameRouter.clientID);
        gameRouter.gameSocket.on('createServerRoom', this.createServerRoom);
        gameRouter.gameSocket.on('serverRoomFull', this.serverRoomFull);
        gameRouter.gameSocket.on('playerJoinServer', this.playerJoinServer);
        gameRouter.gameSocket.on('playerLogout', this.playerLogout);
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
        this.clientID = data.id;
        if (!(gameRouter.clientMap.has(this.clientID))) {
            console.log("client does not exist - gameRouter");
            return;
        }
        gameRouter.gameSocket = gameRouter.clientMap.get(this.clientID);
        let room = gameRouter.gameSocket.rooms['/' + data.serverRoom];
        console.log(data.id + data.serverRoom);
        gameRouter.gameSocket.join(data.serverRoom);
        gameRouter.io.sockets.in(data.serverRoom).emit('playerJoinedServer', data);
    }
    playerDisconnect(client) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.gameSocket.emit("offline");
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