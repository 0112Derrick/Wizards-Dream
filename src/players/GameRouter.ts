import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";

export enum ClientMapSlot {
    Slot1 = 0,
    Slot2 = 1
}

export class GameRouter {
    private io: any;
    private static gameRouter: GameRouter;
    private gameSocket: any;
    private serverRooms: Array<Map<number, Array<Map<string, Object>>>> | null = null;
    private clientMap: Map<string, Array<any>> = new Map();
    private clientID: any;
    public userInfo: any | null = null;

    private constructor() {
    }

    public static get GameRouterInstance(): GameRouter {

        if (this.gameRouter == null) {
            this.gameRouter = new GameRouter();
        }
        return this.gameRouter;
    }

    public setIO(_io) {
        this.io = _io
    }

    public setUserInfo(_data) {
        this.userInfo = _data;
    }

    public get ClientMap(): Map<string, Array<any>> {
        return this.clientMap;
    }

    public get ClientID(): string {
        return this.clientID;
    }

    public setClientMap(_data, slot: ClientMapSlot) {
        if (this.clientMap.has(_data.id)) {
            switch (slot) {
                case ClientMapSlot.Slot1:
                    this.clientMap.get(_data.id)?.splice(0, 1, _data.arg);
                    break;
                case ClientMapSlot.Slot2:
                    this.clientMap.get(_data.id)?.splice(1, 1, _data.arg);
                    break;
            }
        }
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
        let mapArr: Array<any> = [_gameSocket];
        gameRouter.clientMap.set(_gameSocket.id, mapArr);
        this.clientID = _gameSocket.id;
        //this.gameSocket




        //Server Events
        gameRouter.gameSocket.on('createServerRoom', this.createServerRoom);
        gameRouter.gameSocket.on('serverRoomFull', this.serverRoomFull);
        gameRouter.gameSocket.emit('connected', gameRouter.clientID);
        //gameRouter.gameSocket.on("online", this.playerConnected2);

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

        let playerList = new Array($serverSize.serverSize);
        let _serverId = (customId);
        /**
         * creates a serverRoom , using serverId & an array of all players who are currently logged into that server
         */
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

        // Look up the room ID in the Socket.IO manager object.
        let room = gameRouter.gameSocket.rooms['/' + data.serverRoom];
        //if (room != undefined) {
        // attach the socket id to the data object.
        console.log(data.id + data.serverRoom);
        gameRouter.gameSocket.join(data.serverRoom);
        gameRouter.io.sockets.in(data.serverRoom).emit('playerJoinedServer', data);
    }

    // playerConnected2() {
    //     console.log("player connected called - gameRouter");
    //     console.log("server: " + GameRouter.GameRouterInstance.gameSocket.emit("onlineClient", this.clientMap.get(this.clientID)?.at(ClientMapSlot.Slot2).username));
    // }

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

