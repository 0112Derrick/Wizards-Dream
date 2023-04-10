import { ServerSizeConstants as $serverSize, SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { OverworldMap } from "../app/OverworldMap.js";
import { Character as $Character } from "../app/Character.js";
import { Overworld } from "../app/Overworld.js";
import { GameObject } from "../app/GameObject.js"
import { Utils } from "../app/Utils.js";
import { DirectionInput, Direction } from "../app/DirectionInput.js";
import { CharacterMovementData, CharacterData_Direction } from "./interfaces/CharacterInterfaces.js";
import Queue from ".././framework/Queue.js";
import { MovementContants } from "../constants/Constants.js";
import { MapNames } from "../constants/MapNames.js";
import { Overworld_Server } from "./Overworld_Server.js";
import { OverWorld_MapI as $OverWorld_MapI, syncOverworld as $syncOverworld } from "./interfaces/OverworldInterfaces.js";
import { characterDataInterface } from "./interfaces/CharacterDataInterface.js";
import { Socket } from "socket.io";

export enum ClientMapSlot {
    ClientSocket = 0,
    ClientOBJ = 1,
    ClientActiveCharacter = 2,
}

export interface ClientDATA {
    id: string,
    arg: any
}

interface Coordniate {
    x: MovementContants.West_East,
    y: MovementContants.North_South,
}


export class GameRouter {

    private static gameRouter: GameRouter;
    // private server: Map<number, Array<Map<string, Object>>> | null = null;
    private io: any;
    private moveRequestQue: Queue<CharacterData_Direction> = new Queue();
    private moveRequestTimer: number = 100;
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

    private serverRooms: Map<string, string> = new Map();

    /* private OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    }; */

    private currentServerTick: number = 1;

    private serverTickRate: number = 50;

    private Overworld: Overworld_Server = null;

    private constructor() {

        this.serverTick();
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

    /***
     * data should have two parameters id = to clientID & arg which is equal to the data you want to set.
     * slot should be equal to ClientMapSlot to ensure the data is always the same for every player.
     */
    public setClientMap(_data: ClientDATA, slot: ClientMapSlot) {

        if (this.clientMap.has(_data.id)) {
            switch (slot) {
                case ClientMapSlot.ClientSocket:
                    this.clientMap.get(_data.id)?.splice(0, 1, _data.arg);
                    break;
                case ClientMapSlot.ClientOBJ:
                    this.clientMap.get(_data.id)?.splice(1, 1, _data.arg);
                    break;
                case ClientMapSlot.ClientActiveCharacter:
                    this.clientMap.get(_data.id)?.splice(2, 1, _data.arg);
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

    public getMoveRequestQueue() {
        return this.moveRequestQue;
    }

    public getMoveRequestIntervalTime() {
        return this.moveRequestTimer;
    }

    /**
     * This function is called by server.js to initialize a new game instance.
     *
     * @param _io The Socket.IO library
     * @param clientSocket The socket object for the connected client.
     * 
     */

    initGame(_socket: Socket, _ip: string) {
        let gameRouter = GameRouter.GameRouterInstance;

        this.setClientSocket(_socket);

        //Client Events
        _socket.on($socketRoutes.REQUEST_JOIN_SERVER_ROOM, (clientID: string, serverRoom: string) => this.playerJoinServer(clientID, serverRoom));
        _socket.on($socketRoutes.REQUEST_CLIENT_LOGOUT, this.playerLogout);
        _socket.on($socketRoutes.REQUEST_MESSAGE, this.checkMessage);
        _socket.on($socketRoutes.REQUEST_OVERWORLD_GAME_OBJECTS, this.updateGameObjects);
        _socket.on($socketRoutes.REQUEST_PING, (id) => { console.log("request from:", id); GameRouter.GameRouterInstance.io.to(id).emit($socketRoutes.RESPONSE_PONG) });
        _socket.on($socketRoutes.REQUEST_CURRENT_TICK, (id) => { console.log("request from:", id); GameRouter.GameRouterInstance.io.to(id).emit($socketRoutes.RESPONSE_CURRENT_TICK, this.currentServerTick); console.log(this.currentServerTick) })
        // _socket.on("requestOverworld", this.startServerRoom);
        // _socket.on("connection");

        _socket.on($socketRoutes.REQUEST_ACTIVE_SERVERS, this.sendServersList);
        //test events

        _socket.on($socketRoutes.REQUEST_CHARACTER_MOVEMENT, gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, (character: $Character, map: MapNames, clientID: string) => {
            //sets the active character
            gameRouter.clientMap.has(clientID) ? gameRouter.setClientMap({ id: clientID, arg: character }, ClientMapSlot.ClientActiveCharacter) : console.log("Unknown Client");
            //Adds the character to the overworld
            gameRouter.addCharacterToOverworld(character, map);
        });
        // end

        this.createServerRooms();


        //Move characters at a set interval.
        setInterval(() => {
            if (!GameRouter.GameRouterInstance.moveRequestQue.isEmpty()) {
                GameRouter.GameRouterInstance.moveCharacter(GameRouter.GameRouterInstance.moveRequestQue);
            }
            //this.syncOverworld();
        }, GameRouter.GameRouterInstance.getMoveRequestIntervalTime());

    }

    serverTick() {
        // Server Tick
        setInterval(() => {
            //Send current request que to clients

            //empty request que
            this.currentServerTick++;
        }, this.serverTickRate);

    }

    //sends an array of arrays with server names
    sendServersList() {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.io.emit($socketRoutes.RESPONSE_ACTIVE_SERVERS, [...gameRouter.serverRooms]);
    }

    /**
     * 
     * @param characterJSON 
     * @param description
     * syncs the server client side overworld with the data from the server side overworld
     * 
     */
    syncOverworld(): void {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld = gameRouter.getOverworld();
        let syncedOverworld: $syncOverworld = {
            grassyfield: {
                name: MapNames.GrassyField,
                activePlayers: Object.assign({}, overworld.grassyfield.activePlayers),
                gameObjects: [...overworld.grassyfield.gameObjects],
            },
            hallway: {
                name: MapNames.Hallway,
                activePlayers: Object.assign({}, overworld.hallway.activePlayers),
                gameObjects: [...overworld.hallway.gameObjects],
            }
        }
        console.log("Synced Overworld maps data with client");
        gameRouter.io.emit($socketRoutes.RESPONSE_SYNC_OVERWORLD, syncedOverworld);
    }

    /* syncOverworld(): void {
        let syncedOverworld = GameRouter.GameRouterInstance.copyOverworld();
        console.log("\n" + syncedOverworld);
        GameRouter.GameRouterInstance.io.emit("syncOverworld", syncedOverworld);
        return;
    } */

    /* copyOverworld(): Object {
        //let clientOverworld = Object.assign({}, GameRouter.GameRouterInstance.OverworldMaps);
        if (GameRouter.GameRouterInstance.Overworld != null) {
            let clientOverworld = Object.assign({}, GameRouter.GameRouterInstance.Overworld);
            return clientOverworld;
        } else {
            return Object.assign({}, GameRouter.GameRouterInstance.getOverworld());
        }
    } */

    syncPlayersMovements(charactersMovementData: Array<CharacterMovementData>) {
        GameRouter.GameRouterInstance.io.emit($socketRoutes.RESPONSE_SYNC_PLAYERS_MOVEMENTS, charactersMovementData)
    }

    createServerRooms() {
        let gameRouter = GameRouter.GameRouterInstance;

        if (!gameRouter.serverRooms.has("US"))
            gameRouter.serverRooms.set("US", "us-1");

        if (!gameRouter.serverRooms.has("EU"))
            gameRouter.serverRooms.set("EU", "eu-1");

        if (!gameRouter.serverRooms.has("ASIA"))
            gameRouter.serverRooms.set("ASIA", "asia-1");

    }

    checkServerRoomCapacity(serverID: number) {
        let gameRouter = GameRouter.GameRouterInstance;

        /* if (gameRouter.server.has(serverID)) {
            return gameRouter.server.get(serverID).length;
        } else {
            return null;
        } */
    }

    serverRoomFull() {
        console.log("Not implemented");
        /* let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.server.forEach(serverRoom => {
            if (serverRoom.findIndex(null) != -1) {
                console.log(serverRoom.findIndex(null));
            } else {
                console.log("create a new server room");
            }
        })

        throw new Error("Method not implemented"); */
    }



    /* startOverworld() {
        GameRouter.GameRouterInstance.io.emit('startOverworld');
        console.log("Sent startOverworld.");
    } */


    playerJoinServer(playerID: string, server: string) {
        let gameRouter = GameRouter.GameRouterInstance;
        try {
            let socket = gameRouter.clientMap.get(playerID).at(ClientMapSlot.ClientSocket)
            console.log(`User ${socket.id} joined room ${server}`);
            socket.join(server);
            let room = gameRouter.io.sockets.adapter.rooms.get(server);


            if (room) {
                console.log(`Sockets in ${server}: ` + [...room]);
            } else {
                console.log("room doesn't exist");
            }
            gameRouter.io.to(socket.id).emit($socketRoutes.RESPONSE_SERVER_MESSAGE, `Welcome to ${server}`, "Server");
        } catch (error) {
            console.log("Error connecting socket to room: " + error);
        }

    }


    //TODO update all clients and server to remove the character from active characters
    playerDisconnect(client, clientIP) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket.emit($socketRoutes.RESPONSE_OFFLINE_CLIENT);
        throw new Error("method not implemented")
        // gameRouter.clientMap.delete(client.id);
        // gameRouter.removeCharacterFromOverworld(client.characters.at(0));
        //update clients gameMap that the player is no longer there

    }

    //TODO update all clients and server to remove the character from active characters
    playerLogout(id, character: $Character) {
        let gameRouter = GameRouter.GameRouterInstance;
        console.log(`${character.username} has logged out.`);
        gameRouter.clientSocket.emit($socketRoutes.RESPONSE_OFFLINE_CLIENT);
        gameRouter.clientMap.delete(id);
        gameRouter.removeCharacterFromOverworld(character);
    }

    getOverworld() {
        console.log('Overworld created - gameRouter');
        if (GameRouter.GameRouterInstance.Overworld == null || GameRouter.GameRouterInstance.Overworld == undefined) {
            let overworld = GameRouter.GameRouterInstance.Overworld = new Overworld_Server();
            return overworld;
        } else {
            return GameRouter.GameRouterInstance.Overworld;
        }
    }

    updateGameObjects(map: MapNames = MapNames.GrassyField) {
        let gameObjects;
        switch (map) {
            case MapNames.GrassyField:
                gameObjects = GameRouter.GameRouterInstance.getOverworld().grassyfield.gameObjects;
                break;

            case MapNames.Hallway:
                gameObjects = GameRouter.GameRouterInstance.getOverworld().hallway.gameObjects;
                break;

            default:
                gameObjects = GameRouter.GameRouterInstance.getOverworld().grassyfield.gameObjects;
        }

        GameRouter.GameRouterInstance.io.emit($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, gameObjects, map);
    }

    checkMessage(serverRoom: string, message: string, user): void {
        let gameRouter = GameRouter.GameRouterInstance;
        let cleanMessage: string = ''
        if (message) {
            cleanMessage = message;
        }
        if (serverRoom.toLocaleLowerCase() == 'global' || serverRoom == '') {
            console.log('Emitting globally.');
            gameRouter.io.emit($socketRoutes.RESPONSE_MESSAGE, cleanMessage, user);
        }

        gameRouter.io.to(serverRoom).emit($socketRoutes.RESPONSE_MESSAGE, cleanMessage, user);
        //gameRouter.clientSocket.to(server).emit($socketRoutes.RESPONSE_MESSAGE, cleanMessage, user);
        //gameRouter.clientSocket.emit($socketRoutes.RESPONSE_MESSAGE, { roomName: server, message: cleanMessage })
    }

    /**
     * 
     * @param character 
     * @param description takes in a json object of a character and adds it to the overworld,
     * Takes the character objects passes them to a method to sync the client side version of the overworld with the characterJSON 
     * @returns none
     */
    //TODO - controller function which then decides what to do with the data
    addCharacterToOverworld(character: $Character, overworldMap = MapNames.GrassyField): void {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld: Overworld_Server = gameRouter.getOverworld();
        if (!overworldMap) {
            overworldMap = MapNames.GrassyField;
        }

        if (!overworld.maps.get(overworldMap).activePlayers.has(character.username)) {
            overworld.maps.get(overworldMap).activePlayers.set(character.username, character);
        } else {
            gameRouter.syncOverworld();
            return;
        }

        console.log(`${character.username} switched to ${overworldMap} map.`);

        character.location = overworldMap;

        overworld.maps.get(overworldMap).gameObjects.forEach((gameObj, i) => {
            if (gameObj instanceof $Character) {
                if ((gameObj as $Character).username == character.username) {
                    console.log(`${character.username} already exists in ${overworld.maps.get(overworldMap).name} map gameObjects list.`);
                    return;
                }
            }
        });

        overworld.maps.get(overworldMap).gameObjects.push(character);

        gameRouter.syncOverworld();
    }

    //TODO update characters class to have character location to speed this function up
    removeCharacterFromOverworld(character: $Character): void {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld: Overworld_Server = gameRouter.getOverworld();
        let playerFound = false;


        if (overworld.maps.get(character.location).activePlayers.delete(character.name)) {
            console.log("Character was successfully removed.");
            overworld.maps.get(character.location).gameObjects.forEach((gameObj, i) => {
                if (gameObj instanceof $Character) {
                    if ((gameObj as $Character).name == character.name) {
                        console.log(overworld.maps.get(character.location).gameObjects.splice(i, 1) + " was successfully removed.");
                    }
                }
            });
        } else {
            console.log("Unable to remove character.");
        };

        gameRouter.syncOverworld();
    }

    /* addCharacterToOverworld(character: Character, overworld = 'grassyfield'): void {
     todo
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
    } */

    /**
     * 
     * @param characterMovingDirection See name
     * @param characterObject See name
     */

    //research how to make a queue
    addCharacterMoveRequestsToQueue(characterMovingDirection: Direction, characterObject: $Character) {
        let queue = GameRouter.GameRouterInstance.getMoveRequestQueue();
        queue.add({
            direction: characterMovingDirection,
            characterObj: characterObject,
        });
    }


    //TODO Movement system will be updated to be client side using interpolation and periodic updates by the server and anti cheat checks on the server.
    //characterMovingDirection: Direction, characterObject: Character
    moveCharacter(characterMoveRequests: Queue<CharacterData_Direction>) {

        /*  while (!characterMoveRequests.isEmpty()) {
             let currentCharacterMoveRequest = characterMoveRequests.dequeue();
             let delta = {
                 x: currentCharacterMoveRequest.characterObj.x,
                 y: currentCharacterMoveRequest.characterObj.y,
             }
     
             const updateDelta: Coordniate = {
                 x: MovementContants.West_East,
                 y: MovementContants.North_South,
             }
     
             switch (currentCharacterMoveRequest.direction) {
     
                 case Direction.UP:
                     delta.y -= updateDelta.y;
                     break;
     
                 case Direction.DOWN:
                     delta.y += updateDelta.y;
                     break;
     
                 case Direction.LEFT:
                     delta.x -= updateDelta.x;
                     break;
     
                 case Direction.RIGHT:
                     delta.x += updateDelta.x;
                     break;
     
                 default:
                     break;
             }
             let gameObjectsArray = GameRouter.GameRouterInstance.OverworldMaps.grassyField.gameObjects;
     
             gameObjectsArray.forEach(char => {
                 if (char.username == currentCharacterMoveRequest.characterObj.username) {
                     char.x = delta.x;
                     char.y = delta.y;
                 }
     
                 //GameRouter.GameRouterInstance.copyOverworld();
                 GameRouter.GameRouterInstance.syncOverworld();
             });
     
             let characterDeltas: Array<CharacterMovementData> = [];
     
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
    */
    }

}

