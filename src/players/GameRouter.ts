import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";

export enum ClientMapSlot {
    ClientSocket = 0,
    ClientOBJ = 1
}

export class GameRouter {
    private static gameRouter: GameRouter;
    private serverRooms: Array<Map<number, Array<Map<string, Object>>>> | null = null;
    private io: any;

    public client: any | null = null;
    private clientSocket: any;
    private clientMap: Map<string, Array<any>> = new Map();
    private clientIP: string;


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

    public setClient(_client) {
        this.client = _client;
    }

    public get ClientMap(): Map<string, Array<any>> {
        return this.clientMap;
    }

    public get ClientIP(): string {
        return this.clientIP;
    }

    public setClientMap(_data, slot: ClientMapSlot) {
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

    public setClientSocket(_gameSocket) {
        this.clientSocket = _gameSocket;
    }

    public setClientIP(ip: string) {
        this.clientIP = ip;
    }

    /**
     * This function is called by server.js to initialize a new game instance.
     *
     * @param _io The Socket.IO library
     * @param _gameSocket The socket object for the connected client.
     * 
     */
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
        } else {
            let mapArr: Array<any> = [_gameSocket];
            gameRouter.clientMap.set(this.clientIP, mapArr);
        }


        //Server Events
        gameRouter.clientSocket.on('createServerRoom', this.createServerRoom);
        gameRouter.clientSocket.on('serverRoomFull', this.serverRoomFull);
        gameRouter.clientSocket.emit('connected', gameRouter.clientIP);
        gameRouter.clientSocket.on("online", this.playerConnected);

        //PlayerEvents
        gameRouter.clientSocket.on('playerJoinServer', this.playerJoinServer);
        gameRouter.clientSocket.on('playerLogout', this.playerLogout);


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
        this.clientIP = data.id;

        if (!(gameRouter.clientMap.has(this.clientIP))) {
            console.log("client does not exist - gameRouter");
            return;
        }

        gameRouter.clientSocket = gameRouter.clientMap.get(this.clientIP)?.at(ClientMapSlot.ClientSocket);
        console.log('ip (gameRouter - join server): ', gameRouter.ClientIP);
        // Look up the room ID in the Socket.IO manager object.
        let room = gameRouter.clientSocket.rooms['/' + data.serverRoom];
        //if (room != undefined) {
        // attach the socket id to the data object.
        console.log(data.id + data.serverRoom);
        gameRouter.clientSocket.join(data.serverRoom);
        gameRouter.io.sockets.in(data.serverRoom).emit('playerJoinedServer', data);
    }

    playerConnected(id) {
        console.log("player connected called - gameRouter");
        let gameRouter = GameRouter.GameRouterInstance;
        // let characterName = gameRouter.ClientMap.get(id).at(ClientMapSlot.ClientOBJ).characters.username;
        //console.log(characterName);
    }

    playerDisconnect(client) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket.emit("offline");
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

