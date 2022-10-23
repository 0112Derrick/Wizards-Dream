import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { OverworldMap } from "../app/OverworldMap.js";
import { Character } from "../app/Character.js";
import { Overworld } from "../app/Overworld.js";
import { GameObject } from "../app/GameObject.js"
import { Utils } from "../app/Utils.js";

export enum ClientMapSlot {
    ClientSocket = 0,
    ClientOBJ = 1
}

export interface ClientDATA {
    id: string,
    arg: any
}



interface coordniate {
    x: number,
    y: number
}
// player01: new Character({
//     isPlayerControlled: true,
//     x: Utils.withGrid(6),
//     y: Utils.withGrid(6),
//     src: "/images/characters/players/erio.png",
//     direction: 'down'
// })


/**
 * 
 * @param obj 
 *     this.characterID = config.characterID || 1;
        this.username = config.username || 'newCharacter';
        this.attributes = config.atrributes || new CharacterAttributes();
        this.characterGender = config.characterGender || 'male';
        this.class = config.class || 'none';
        this.guild = config.guild || 'none';
        this.items = config.items || [];
        this.player = config.player;
 * 
 */





export class GameRouter {

    private static gameRouter: GameRouter;
    private serverRooms: Array<Map<number, Array<Map<string, Object>>>> | null = null;
    private io: any;
    // temporary map storing client info until we can verify and connect that info to a clientsocket
    private clientInitMap: Map<string, Object> = new Map();

    // passed from req object when page is loaded
    public client: any | null = null;
    //passed from server on connection
    private clientSocket: any;
    //Set by server once a client connects
    private clientMap: Map<string, Array<any>> = new Map();
    //Set by req obj 
    private clientIP: string;
    private OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    };


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
        _socket.on("message", this.checkMessage);

        //test events
        if (gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ)) {
            if (gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters.at(0))
                _socket.emit('syncPlayer', gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters.at(0));
        }

        _socket.on("moveReq", gameRouter.moveCharacter);
        _socket.on("characterCreated", gameRouter.addCharacterToOverworld);
        // end

        if (this.serverRooms == null) {
            this.serverRooms = [];
            this.createServerRoom();
        }
    }

    checkMessage(message: string, user): void {
        let cleanMessage: string = ''
        if (message) {
            cleanMessage = message;
        }
        GameRouter.GameRouterInstance.io.emit('globalMessage', cleanMessage, user);
    }

    /**
     * 
     * @param character 
     * @param description takes in a json object of a character and adds it to the overworld,
     * Takes the character objects passes them to a method to sync the client side version of the overworld with the characterJSON 
     * @returns none
     */
    addCharacterToOverworld(character): void {
        let arr = GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].username == character.username) {
                GameRouter.GameRouterInstance.syncOverworld();
                return
            }
        }
        GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects.push(character);
        console.log(character.username + " added to the overworld");
        GameRouter.GameRouterInstance.syncOverworld();
        return;
    }


    moveCharacter(direction, obj) {
        let delta = { x: obj.x, y: obj.y }
        switch (direction) {
            case "up":
                delta.y -= 0.5;
                break;
            case "down":
                delta.y += 0.5;
                break;

            case "left":
                delta.x -= 0.5;
                break;

            case "right":
                delta.x += 0.5;
                break;
            default:
                delta;
                break;
        }
        let arr = GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects;

        arr.forEach(char => {
            if (char.username == obj.username) {
                char.x = delta.x;
                char.y = delta.y
            }

            GameRouter.GameRouterInstance.syncOverworld();
        })
        //this.io.emit("moveReqAction", delta, obj);
    }


    /**
     * 
     * @param characterJSON 
     * @param description
     * syncs the server client side overworld with the data from the server side overworld
     * 
     */
    syncOverworld(): void {
        GameRouter.GameRouterInstance.io.emit("syncOverworld", GameRouter.GameRouterInstance.copyOverworld());
        return;
    }

    copyOverworld(): Object {
        let clientOverworld = Object.assign({}, GameRouter.GameRouterInstance.OverworldMaps)
        return clientOverworld;
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

