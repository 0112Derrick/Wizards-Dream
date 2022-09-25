import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
<<<<<<< HEAD
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
=======


export class GameRouter {
    private io: any;
    private gameSocket: any;
    private serverRooms: Array<Map<number, Array<Map<string, Object>>>> | null = null;
    private static gameRouter: GameRouter;
    private clientMap: Map<string, any> = new Map();
    private clientID: any;

    private constructor() {

    }

    public static get GameRouterInstance(): GameRouter {
        if (this.gameRouter == null) {
>>>>>>> multiplayer
            this.gameRouter = new GameRouter();
        }
        return this.gameRouter;
    }

<<<<<<< HEAD
    createServerRoom(customId = 0) {
=======
    public setIO(_io) {
        this.io = _io
    }

    public setClientSocket(_gameSocket) {
        this.gameSocket = _gameSocket;
    }

    /**
     * This function is called by server.js to initialize a new game instance.
     *
     * @param _io The Socket.IO library
     * @param _gameSocket The socket object for the connected client.
     */
    initGame(_io, _gameSocket) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.io = _io;
        gameRouter.gameSocket = _gameSocket;
        gameRouter.clientMap.set(_gameSocket.id, _gameSocket);
        this.clientID = _gameSocket.id;
        //this.gameSocket
        gameRouter.gameSocket.emit('connected', gameRouter.clientID);
        gameRouter.gameSocket.emit('online', gameRouter.clientID);

        //Server Events
        gameRouter.gameSocket.on('createServerRoom', this.createServerRoom);
        gameRouter.gameSocket.on('serverRoomFull', this.serverRoomFull);

        //PlayerEvents
        gameRouter.gameSocket.on('playerJoinServer', this.playerJoinServer);
        gameRouter.gameSocket.on('playerLogout', this.playerLogout);

        if (this.serverRooms == null) {
            this.serverRooms = [];
            this.createServerRoom();
        }
    }

    createServerRoom(customId = 0) {
        let gameRouter = GameRouter.GameRouterInstance
>>>>>>> multiplayer
        let playerList = new Array($serverSize.serverSize);
        let _serverId = (customId);
        /**
         * creates a serverRoom , using serverId & an array of all players who are currently logged into that server
         */
<<<<<<< HEAD
        let server: Map<number, Array<Map<string, boolean>>> = new Map([[_serverId, playerList]]);
        this.serverRooms!.push(server);
        let sock = this.io();
        this.startServer(_serverId);
    }

    startServer(serverId) {
        let world = this.createOverworld();
        this.io.sockets.in(serverId).emit('newServerWorld', world);
=======
        let server: Map<number, Array<Map<string, Object>>> = new Map([[_serverId, playerList]]);
        gameRouter.serverRooms!.push(server);

        gameRouter.startServer(_serverId);
    }

    startServer(serverId) {
        let gameRouter = GameRouter.GameRouterInstance;
        console.log('starting server');
        let players: Array<Map<string, Object>> = this.serverRooms?.at(0)?.get(0)!;
        let world = this.createOverworld([...players]);
        gameRouter.io.sockets.in(serverId).emit('newServerWorld', world);
>>>>>>> multiplayer
    }

    serverRoomFull() {
        console.log("Not implemented");
        throw new Error("Method not implemented");
    }

    playerJoinServer(data) {
<<<<<<< HEAD
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
=======
        let gameRouter = GameRouter.GameRouterInstance;
        this.clientID = data.id;

        if (!(gameRouter.clientMap.has(this.clientID))) {
            console.log("client does not exist - gameRouter");
            return;
        }

        gameRouter.gameSocket = gameRouter.clientMap.get(this.clientID);

        // Look up the room ID in the Socket.IO manager object.
        let room = gameRouter.gameSocket.rooms['/' + data.serverRoom];
        //if (room != undefined) {
        // attach the socket id to the data object.
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
        // this.gameSocket.close();
    }

    createOverworld(playerList) {
        console.log('Create overworld not implemented - gameRouter');

        // throw new Error("Method not implemented.");
    }
}

>>>>>>> multiplayer
