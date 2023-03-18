import { ServerSizeConstants as $serverSize } from "../constants/ServerSizeConstants.js";
import { OverworldMap } from "../app/OverworldMap.js";
import { Character } from "../app/Character.js";
import { Overworld } from "../app/Overworld.js";
import { GameObject } from "../app/GameObject.js"
import { Utils } from "../app/Utils.js";
import { DirectionInput, Direction } from "../app/DirectionInput.js";
import { CharacterMovementData, CharacterData_Direction } from "./interfaces/CharacterInterfaces.js";
import Queue from ".././framework/Queue.js";
import { MovementContants } from "../constants/Constants.js";
import { MapNames } from "../constants/MapNames.js";
import { Overworld_Server } from "./Overworld_Server.js";
import { OverWorld_MapI as $OverWorld_MapI, OverWorld_MapI, syncOverworld as $syncOverworld } from "./interfaces/OverworldInterfaces.js";

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
    private server: Map<number, Array<Map<string, Object>>> | null = null;
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
    private OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    };

    private Overworld: Overworld_Server = null;

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
    initGame(_socket, _ip: string) {
        let gameRouter = GameRouter.GameRouterInstance;

        //Server Events
        _socket.on('serverRoomFull', this.serverRoomFull);
        //_socket.emit('connected', _ip);
        _socket.on("online", this.playerConnected);

        //PlayerEvents
        _socket.on('playerJoinServer', this.playerJoinServer);
        _socket.on('playerLogout', this.playerLogout);
        _socket.on("message", this.checkMessage);
        _socket.on("requestOverworld", this.startServerRoom);
        _socket.on("requestOverworldGameObjects", this.updateGameObjects);
        //_socket.on("connection");

        //test events
        /* if (gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ)) {
            if (gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters.at(0))
                //_socket.emit('syncPlayer', gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters.at(0));
                _socket.emit('syncPlayer', gameRouter.getClientMap().get(_ip).at(ClientMapSlot.ClientOBJ).characters);
        } */

        //_socket.on("moveReq", gameRouter.moveCharacter);
        _socket.on("moveReq", gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on("characterCreated", (character: Character, map: MapNames, clientID: string) => gameRouter.addCharacterToOverworld);
        // end

        if (GameRouter.GameRouterInstance.server == null) {
            /* this.server = {
                serverRooms: [],
            } */
            this.server = new Map();
            this.createServerRoom();
        }

        //Move characters at a set interval.
        setInterval(() => {
            if (!GameRouter.GameRouterInstance.moveRequestQue.isEmpty()) {
                GameRouter.GameRouterInstance.moveCharacter(GameRouter.GameRouterInstance.moveRequestQue);
            }
        }, GameRouter.GameRouterInstance.getMoveRequestIntervalTime());

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
                gameObjects: Object.assign({}, overworld.grassyfield.gameObjects),
            },
            hallway: {
                name: MapNames.Hallway,
                activePlayers: Object.assign({}, overworld.hallway.activePlayers),
                gameObjects: Object.assign({}, overworld.hallway.gameObjects),
            }
        }
        console.log("Synced Overworld maps data with client");
        gameRouter.io.emit("syncOverworld", syncedOverworld);
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
        GameRouter.GameRouterInstance.io.emit("syncPlayersMovements", charactersMovementData)
    }

    createServerRoom(customId: number = 0) {
        let gameRouter = GameRouter.GameRouterInstance;
        let serverRoom = new Array<Map<string, any>>($serverSize.serverSize);
        if (gameRouter.server.size > customId) {
            customId = gameRouter.server.size + 1;
        }
        let _serverId = customId;

        //let serverRoom: Array<Map<string, any>> = playersList;
        //let serverRoom: Map<number, Array<Map<string, Object>>> = new Map([[_serverId, playersList]]);
        //gameRouter.server.serverRooms.push(serverRoom);

        /**
            * creates a serverRoom , using serverId & an array of all players who are currently logged into that server
        */

        gameRouter.server.set(_serverId, serverRoom);
        gameRouter.startServerRoom(_serverId);
    }

    checkServerRoomCapacity(serverID: number): number | null {
        let gameRouter = GameRouter.GameRouterInstance;

        if (gameRouter.server.has(serverID)) {
            return gameRouter.server.get(serverID).length;
        } else {
            return null;
        }
    }


    startServerRoom(serverId: number) {
        if (!serverId) {
            serverId = 0;
        }
        let gameRouter = GameRouter.GameRouterInstance;
        console.log('starting server');
        let playerList: Array<Map<string, any>> | null;

        if (gameRouter.server.has(serverId)) {
            playerList = gameRouter.server.get(serverId);
        } else {
            playerList = null;
        }

        //let players: Array<Map<string, Object>> = gameRouter.server.at(0)?.get(0)!;
        let world = this.getOverworld();
        GameRouter.GameRouterInstance.io.emit('newServerWorld', world);
        console.log("Sent newServerWorld.\n" + world);

        setTimeout(() => {
            this.startOverworld();
        }, 1000);
        //gameRouter.io.sockets.in(serverId).emit('newServerWorld', world);
    }
    startOverworld() {
        GameRouter.GameRouterInstance.io.emit('startOverworld');
        console.log("Sent startOverworld.");
    }

    serverRoomFull() {
        console.log("Not implemented");
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.server.forEach(serverRoom => {
            if (serverRoom.findIndex(null) != -1) {
                console.log(serverRoom.findIndex(null));
            } else {
                console.log("create a new server room");
            }
        })

        throw new Error("Method not implemented");
    }

    //TODO IMPLEMENT system to start overworld on client once the client connects to the server.
    playerJoinServer(data) {
        let gameRouter = GameRouter.GameRouterInstance;
        this.clientIP = data.id;
        //todo
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

    //TODO update all clients and server to remove the character from active characters
    playerDisconnect(client, clientIP) {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.clientSocket.emit("offline");
        gameRouter.clientMap.delete(client.id);
        gameRouter.removeCharacterFromOverworld(client.characters.at(0));
        //update clients gameMap that the player is no longer there

    }
    //TODO update all clients and server to remove the character from active characters
    playerLogout(client) {
        let gameRouter = GameRouter.GameRouterInstance;
        console.log('player logout not implemented - gameRouter');
        gameRouter.clientSocket.emit("offline");
        gameRouter.clientMap.delete(client.id);
        gameRouter.removeCharacterFromOverworld(client.characters.at(0));
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

        GameRouter.GameRouterInstance.io.emit('updatedGameObjects', gameObjects, map);
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
    //TODO - controller function which then decides what to do with the data
    addCharacterToOverworld(character: Character, overworldMap = MapNames.GrassyField, clientID: string): void {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld: Overworld_Server = gameRouter.getOverworld();
        gameRouter.clientMap.has(clientID) ? gameRouter.setClientMap({ id: clientID, arg: character }, ClientMapSlot.ClientActiveCharacter) : console.log("Unknown Client");
        let activeCharacters = null;

        switch (overworldMap) {
            case MapNames.GrassyField:
                activeCharacters = overworld.grassyfield.activePlayers;
                for (let i = 0; i < activeCharacters.length; i++) {
                    if (character.name == activeCharacters[i].name) {
                        gameRouter.syncOverworld();
                        return;
                    }
                }
                activeCharacters.push(character);
                overworld.grassyfield.gameObjects.push(character);
                console.log(character.username + " was added to overworld map grassyfield - server");
                break;

            case MapNames.Hallway:
                activeCharacters = overworld.hallway.activePlayers;
                for (let i = 0; i < activeCharacters.length; i++) {
                    if (character.name == activeCharacters[i].name) {
                        gameRouter.syncOverworld();
                        return;
                    }
                }
                activeCharacters.push(character);
                overworld.hallway.gameObjects.push(character);
                console.log(character.username + " was added to overworld map hallway - server");
                break;

        }
        gameRouter.syncOverworld();
    }

    //TODO update characters class to have character location to speed this function up
    removeCharacterFromOverworld(character: Character): void {
        let gameRouter = GameRouter.GameRouterInstance;
        let overworld: Overworld_Server = gameRouter.getOverworld();
        let playerFound = false;

        overworld.maps.forEach((map: $OverWorld_MapI) => {
            if (map.name == character.location) {
                map.activePlayers.forEach((activeCharacter: Character, i: number) => {
                    if (character.name == activeCharacter.name) {
                        console.log(overworld.grassyfield.activePlayers.splice(i, 1) + " was removed.");
                        playerFound = true;
                    }
                })
            }
        })

        switch (character.location) {
            case MapNames.GrassyField:
                overworld.grassyfield.activePlayers.forEach((activeCharacter: Character, i: number) => {
                    if (character.name == activeCharacter.name) {
                        console.log(overworld.grassyfield.activePlayers.splice(i, 1) + " was removed.");
                        playerFound = true;
                    }
                })
                break;

            case MapNames.Hallway:

                break;
        }

        //
        overworld.grassyfield.activePlayers.forEach((activeCharacter: Character, i: number) => {
            if (character.name == activeCharacter.name) {
                console.log(overworld.grassyfield.activePlayers.splice(i, 1) + " was removed.");
                playerFound = true;
            }
        });
        if (playerFound) {
            overworld.grassyfield.gameObjects.forEach((gameObject: GameObject, i: number) => {
                if (gameObject instanceof (Character)) {
                    if (character.name == (gameObject as Character).name) {
                        overworld.grassyfield.gameObjects.splice(i, 1);
                    }
                }
            })
        } else {
            overworld.hallway.activePlayers.forEach((activeCharacter: Character, i: number) => {
                if (character.name == activeCharacter.name) {
                    console.log(overworld.hallway.activePlayers.splice(i, 1) + " was removed.");
                    playerFound = true;
                }
            });
            if (playerFound) {
                overworld.hallway.gameObjects.forEach((gameObject: GameObject, i: number) => {
                    if (gameObject instanceof (Character)) {
                        if (character.name == (gameObject as Character).name) {
                            overworld.hallway.gameObjects.splice(i, 1);
                        }
                    }
                })
            }
        }
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
    addCharacterMoveRequestsToQueue(characterMovingDirection: Direction, characterObject: Character) {
        let queue = GameRouter.GameRouterInstance.getMoveRequestQueue();
        queue.add({
            direction: characterMovingDirection,
            characterObj: characterObject,
        });
    }


    //TODO Movement system will be updated to be client side using interpolation and periodic updates by the server and anti cheat checks on the server.
    //characterMovingDirection: Direction, characterObject: Character
    moveCharacter(characterMoveRequests: Queue<CharacterData_Direction>) {

        while (!characterMoveRequests.isEmpty()) {
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

                GameRouter.GameRouterInstance.copyOverworld();
                //GameRouter.GameRouterInstance.syncOverworld();
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

    }

}

