import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { io } from 'socket.io-client';

export class GameRouter {

    private io: any;
    private gameSocket: any;
    private serverRooms: Array<Map<number, Array<Map<string, boolean>>>> | null = null;
    public gameRouter: GameRouter | null = null;

    constructor() {


    }

    // This function is called by index.js to initialize a new game instance.
    initGame(_io, _gameSocket) {
        this.io = _io;
        this.gameSocket = _gameSocket;

        if (this.serverRooms == null) {
            this.serverRooms = [];
            this.createServerRoom();
        }

        this.gameSocket.emit('connected', { message: "You're connected!" });

        //Server Events
        this.gameSocket.on('createServerRoom', this.createServerRoom);
        this.gameSocket.on('serverRoomFull', this.serverRoomFull);

        //PlayerEvents
        this.gameSocket.on('playerJoinServer', this.playerJoinServer);
        this.gameSocket.on('playerLogout', this.playerLogout);
    }

    playerDisconnect(id: any) {
        throw new Error('Method not implemented.');
    }

    public get GameRouterInstance(): GameRouter {
        if (!this.gameRouter) {
            this.gameRouter = new GameRouter();
        }
        return this.gameRouter;
    }

    createServerRoom(customId = 0) {
        let playerList = new Array($serverSize.serverSize);
        let _serverId = (customId);
        /**
         * creates a serverRoom , using serverId & an array of all players who are currently logged into that server
         */
        let server: Map<number, Array<Map<string, boolean>>> = new Map([[_serverId, playerList]]);
        this.serverRooms!.push(server);
        let sock = this.io();
        this.startServer(_serverId);
    }

    startServer(serverId) {
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
            // attach the socket id to the data object.
            console.log(data.id + '');
            this.gameSocket.join(data.gameId);
            this.io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
        }
    }

    playerLogout() {
        console.log('player logout not implemented - gameRouter')
        throw new Error("Method not implemented.");
    }

    createOverworld() {
        console.log('Create overworld not implemented - gameRouter');
        // throw new Error("Method not implemented.");
    }
}