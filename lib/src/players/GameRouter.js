import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
export class GameRouter {
    io;
    gameSocket;
    serverRooms = null;
    constructor(_io, _gameSocket) {
        this.io = _io;
        this.gameSocket = _gameSocket;
        if (this.serverRooms == null) {
            this.serverRooms = [];
            this.createServerRoom();
        }
    }
    initGame() {
        this.gameSocket.emit('connected', { message: "You're connected!" });
        this.gameSocket.on('createServerRoom', this.createServerRoom);
        this.gameSocket.on('serverRoomFull', this.serverRoomFull);
        this.gameSocket.on('playerJoinServer', this.playerJoinServer);
        this.gameSocket.on('playerLogout', this.playerLogout);
    }
    createServerRoom(customId = 0) {
        let playerList = new Array($serverSize.serverSize);
        let _serverId = (customId);
        let server = new Map([[_serverId, playerList]]);
        this.serverRooms.push(server);
        let sock = this.io();
        this.startServer(_serverId);
    }
    startServer(serverId) {
        console.log('starting server');
        let world = this.createOverworld();
        this.io.sockets.in(serverId).emit('newServerWorld', world);
    }
    serverRoomFull() {
        console.log("Not implemented");
        throw new Error("Method not implemented");
    }
    playerJoinServer(data) {
        let room = this.gameSocket.manager.rooms['/' + data.gameId];
        if (room != undefined) {
            console.log(data.id + '');
            this.gameSocket.join(data.gameId);
            this.io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
        }
    }
    playerLogout() {
        console.log('player logout not implemented - gameRouter');
        throw new Error("Method not implemented.");
    }
    createOverworld() {
        console.log('Create overworld not implemented - gameRouter');
    }
}
//# sourceMappingURL=GameRouter.js.map