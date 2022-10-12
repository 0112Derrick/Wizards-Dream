import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { OverworldMap } from "../app/OverworldMap.js";
import { Character } from "../app/Character.js";
import { Overworld } from "Overworld.js";

export enum ClientMapSlot {
    ClientSocket = 0,
    ClientOBJ = 1
}

export interface ClientDATA {
    id: string,
    arg: any
}

export class TestPlayer {
    private id: number;
    public x: number = 0;
    public y: number = 0;

    public constructor(_id) {
        this.id = _id;
    }

}

interface coordniate {
    x: number,
    y: number
}

export class GameRouter {

    private static gameRouter: GameRouter;
    private serverRooms: Array<Map<number, Array<Map<string, Object>>>> | null = null;
    private io: any;
    private clientInitMap: Map<string, Object> = new Map();

    // passed from req object when page is loaded
    public client: any | null = null;
    //passed from server on connection
    private clientSocket: any;
    //Set by server once a client connects
    private clientMap: Map<string, Array<any>> = new Map();
    //Set by req obj 
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


    private player: TestPlayer;
    private playerMap: Map<string, TestPlayer> = new Map();



    testInitGame(_socket, _ip, player: TestPlayer) {
        if (!this.playerMap.has(_ip)) {
            this.playerMap.set(_ip, player);
        } else {
            this.player = this.playerMap.get(_ip);
        }

        _socket.on('move', this.movePlayer);
    }

    movePlayer(coords: coordniate, ip: string) {
        if (GameRouter.GameRouterInstance.playerMap.has(ip)) {
            let player = GameRouter.GameRouterInstance.playerMap.get(ip);
            player.x = coords.x;
            player.y = coords.y;
            GameRouter.GameRouterInstance.io.emit('movePlayer', player);
        }
    }

    /**
     * 
     * @param _client 
     * @param ip 
     * @param description Sets a temporary client variable so we can verify the user when they connect with sockets
     */

    public setClient(_client, ip) {
        let gameRouter = GameRouter.GameRouterInstance;
        if (!gameRouter.clientInitMap.has(ip)) {
            gameRouter.clientInitMap.set(ip, _client);
        }
    }

    public getClient(ip: string) {
        let gameRouter = GameRouter.GameRouterInstance;
        if (gameRouter.clientInitMap.has(ip)) {
            return gameRouter.clientInitMap.get(ip);
        }
        return null;
    }



    public get ClientIP(): string {
        return this.clientIP;
    }

    public setClientMap(_data: ClientDATA, slot: ClientMapSlot) {

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

    public setClientSocket(_gameSocket) {
        this.clientSocket = _gameSocket;
    }

    public setClientIP(ip: string) {
        this.clientIP = ip;
    }

    public getClientIP() {
        return this.clientIP;
    }





    /**
     * This function is called by server.js to initialize a new game instance.
     *
     * @param _io The Socket.IO library
     * @param clientSocket The socket object for the connected client.
     * 
     */
    initGame(_socket, _ip) {
        let gameRouter = GameRouter.GameRouterInstance;

        //Server Events
        _socket.on('serverRoomFull', this.serverRoomFull);
        _socket.emit('connected', _ip);
        _socket.on("online", this.playerConnected);

        //PlayerEvents
        _socket.on('playerJoinServer', this.playerJoinServer);
        _socket.on('playerLogout', this.playerLogout);

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

    createOverworld() {
        console.log('Create overworld not implemented - gameRouter');
        // GameRouter.GameRouterInstance.clientMap(ip)

        // throw new Error("Method not implemented.");
    }
}

