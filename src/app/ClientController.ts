import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";

import { appendFile } from "fs";
import { CharacterCreationDataInterface as $characterSignup, characterDataInterface as $characterDataInterface } from '../players/interfaces/CharacterDataInterface.js'
import { Character as $Character, Character } from "../app/Character.js"
import { Utils } from "../app/Utils.js"
import { Overworld } from "./Overworld.js";
import { GameObject } from "GameObject.js";
import { DirectionInput, Direction as $Direction } from "./DirectionInput.js";
import { CharacterMovementData } from "../players/interfaces/CharacterInterfaces.js";
import { GameMap } from "./GameMap.js";
import { Overworld_Test } from "./Overworld_Test.js";
import { MapNames } from "../constants/MapNames.js";
import { MapConfigI, syncOverworld as $syncOverworld } from "../players/interfaces/OverworldInterfaces.js";
import { OverworldMapsI } from "../players/interfaces/OverworldInterfaces.js";
import { Socket } from "socket.io-client";
import { MessageHeader as $MessageHeader, Message as $Message } from "../framework/MessageHeader.js"
import { CharacterVelocity as $CharacterVelocity, CharacterSize as $CharacterSize } from "../constants/CharacterAttributesConstants.js";
import { Sprite } from "./Sprite.js";
import Queue from "../framework/Queue.js";
import { ServerMessages } from '../constants/ServerMessages.js'


interface ClientToServerEvents {
    playerJoinedServer: (data: number) => void;
    basicEmit: (a: number, b: string, c: number[]) => void;
}



interface ServerToClientEvents {
    withAck: (d: string, cb: (e: number) => void) => void;
}

interface inputHistory {
    location: { x: number, y: number },
    tick: number,
    confirmedPosition: boolean,
}

export class ClientController extends $OBSERVER {

    private view = $MainAppView;
    private networkProxy: NetworkProxy;
    private socket: Socket;
    private clientID: string = "";
    private client: any;
    private character: any = null;
    private characters: Array<any> = [];
    private static clientController: ClientController = null;
    private activeServer: string = null;
    private clientTickRate: number = 50;
    private currentClientTick: number = 1;
    private client_server_latency: number = 0;
    private latency_count: number = 3;
    private adjustmentIteration: number = 0;
    private clientInputHistory: Array<inputHistory> = new Array<inputHistory>();
    private clientMovementBuffer: Queue<$Direction> = new Queue();
    private messageHistory: Array<$MessageHeader> = [];


    private grassyfieldConfig: MapConfigI = {
        gameObjects: new Array<GameObject>(),
        activeCharacters: null,
        name: MapNames.GrassyField,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground1.png',
        upperImageSrc: '/images/maps/Battleground1.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0
    }

    private hallwayConfig: MapConfigI = {
        gameObjects: new Array<GameObject>(),
        activeCharacters: null,
        name: MapNames.Hallway,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground2.png',
        upperImageSrc: '/images/maps/Battleground2.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
        targetFPS: 20,
        targerInterval: 1000 / 20,
        lastFrameTime: 0
    }
    /* private OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    }; */

    /* private OVERWORLD = new Overworld({
        element: document.querySelector(".game-container")
    }); */

    private OVERWORLD: Overworld_Test = null;

    constructor(networkProxy: NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.init();

        //this.listenForEvent($events.START_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = false; this.OVERWORLD.startGameLoop(); }, this.view);
        //this.listenForEvent($events.STOP_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = true; }, this.view);
        this.listenForEvent($events.SELECT_CHARACTER, (e) => { ClientController.ClientControllerInstance.characterSelectionCallback(e) }, this.view);
        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);

        this.listenForEvent($events.REQUEST_SERVER_ROOMS, () => {
            ClientController.ClientControllerInstance.requestActiveServers();
        }, this.view)

        this.listenForEvent($events.SELECT_SERVER, (data) => {
            ClientController.ClientControllerInstance.joinServer(data)
        }, this.view);

        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message) }, this.view);


        document.addEventListener('visibilitychange', () => {
            console.log('Visibility state:', document.visibilityState);
            if (document.visibilityState === 'visible') {
                if (!this.socket || this.socket.disconnected) {
                    console.log('Reconnecting socket...');
                    this.init();
                }
            }
        });

    }

    public static get ClientControllerInstance(): ClientController {

        if (this.clientController == null) {
            this.clientController = new ClientController(new $HTMLNetwork());
        }
        return this.clientController;
    }


    async connectSocket() {
        //@ts-ignore
        this.socket = await io();
        this.socket.on('connect', () => {
            console.log('Socket connected:' + this.socket.id);
            this.setID(this.socket.id);
            ClientController.ClientControllerInstance.getLatency();
            ClientController.ClientControllerInstance.setCurrentTick().then(() => { ClientController.ClientControllerInstance.clientTick(); });
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    async init() {
        // @ts-ignore


        this.connectSocket().then(async () => {

            this.socket.on($socketRoutes.RESPONSE_CLIENT_JOINED_SERVER, this.playerJoinedServer);
            this.socket.on($socketRoutes.RESPONSE_ONLINE_CLIENT, (client) => { this.connect(client) });
            this.socket.on($socketRoutes.RESPONSE_OFFLINE_CLIENT, this.disconnect);
            this.socket.on($socketRoutes.RESPONSE_RECONNECT_CLIENT, () => {
                if (!document.hidden) {
                    window.location.reload();
                }
            });
            this.socket.on($socketRoutes.RESPONSE_UPDATE_CLIENTS_TICK, (tick: number, iteration: number) => { this.adjustCurrentTick(tick, iteration) })
            this.socket.on($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, (gameObjects, map: MapNames) => {
                this.updateGameObjects;
            });


            //proof of concept events
            //this.socket.on('movePlayer', () => { this.updatePlayer });
            // this.socket.on('syncPlayer', (ListOfCharacters) => { this.sendViewCharacterSelection(ListOfCharacters); });
            this.socket.on($socketRoutes.RESPONSE_SYNC_OVERWORLD, (overworld) => { this.syncOverworld(overworld) })
            this.socket.on($socketRoutes.RESPONSE_SYNC_PLAYERS_MOVEMENTS, (charactersMovementData: Array<CharacterMovementData>) => { this.syncPlayersMovements(charactersMovementData) })
            this.socket.on($socketRoutes.RESPONSE_MESSAGE, (message: string, username: string) => { this.postMessage(message, username) })
            this.socket.on($socketRoutes.RESPONSE_SERVER_MESSAGE, (message: string) => { this.postMessage(message, 'Server') })
            this.socket.on($socketRoutes.RESPONSE_ACTIVE_SERVERS, (servers: Array<string>) => {
                this.receiveActiveServers(servers);
            });

        });
        //end concepts

        /*  document.querySelector('#joinServer')?.addEventListener('click', () => {
             let data = {
                 id: this.clientID,
                 serverRoom: $servers.ROOM1
             }
             this.socket.emit('playerJoinServer', data);
         }); */
        //TODO: setInterval(){(character) => {save character} ,time}
    }

    getLatency() {
        if (this.getID()) {
            let startTime: number;
            startTime = Date.now();
            this.socket.emit($socketRoutes.REQUEST_PING, this.clientID);

            this.socket.on($socketRoutes.RESPONSE_PONG, () => {
                const rtt = Date.now() - startTime;
                this.client_server_latency = rtt;
                console.log(`Round Trip time: ${rtt} ms`);
            });
        } else {
            setTimeout(() => { this.getLatency() }, 500)
        }
    }

    getID(): string {
        if (this.clientID != "")
            return this.clientID;
        throw new Error("ID not set");
    }

    setCurrentTick() {
        console.log("Getting current tick ", Date.now());

        this.socket.emit($socketRoutes.REQUEST_CURRENT_TICK, this.clientID);
        console.log("id: ", this.clientID);

        this.socket.on($socketRoutes.RESPONSE_CURRENT_TICK, (tick) => {
            console.log("server tick: ", tick);
            this.currentClientTick = tick + this.latency_count;

            if (this.client_server_latency >= 16) {
                this.currentClientTick++;
                this.latency_count++;
            }
            console.log("client tick: ", this.currentClientTick);
        });

        return new Promise((resolve) => { resolve(true); });
    }

    adjustCurrentTick(adjustmentAmount: number, adjustmentIteration: number) {
        if (adjustmentIteration == this.adjustmentIteration) {
            return;
        }

        this.currentClientTick += adjustmentAmount;
        this.latency_count += adjustmentAmount;
        this.adjustmentIteration++;
        console.log(`current client tick: ${this.currentClientTick}, iteration: ${this.adjustmentIteration}`);
    }

    notifyServer(type: ServerMessages, currentDirection: any) {
        let messageCount = 1;
        switch (type) {
            case ServerMessages.Attack:
                //  this.createMessage(currentDirection,attack, type);
                break;

            case ServerMessages.Movement:
                let message = this.createMessage(currentDirection, type, this.adjustmentIteration, messageCount, this.currentClientTick, this.getID());
                if (!message) {
                    return;
                }
                this.socket.emit($socketRoutes.REQUEST_CLIENT_ACTION_MESSAGE, message)
                break;
        }

        throw new Error("Method not implemented.");
    }

    createMessage(action: string, type: ServerMessages, adjustmentIteration: number, messageCount: number, tick: number, id: string,) {
        if (!id) {
            console.log("Socket connection not established.");
            return null;
        }

        let message = new $Message(type, action, tick, id);
        let clientMessage = new $MessageHeader(adjustmentIteration, message, id);
        this.messageHistory.push(clientMessage);
        return clientMessage;
    }

    clientTick() {
        setInterval(() => {

            /*predict clients movement
                based on clients input direction */
            //add movement to buffer
            //pop client off of buffer and begin processing
            //update clients movement on screen and x / y coordinate
            //update clients movement history
            //clients position, current tick, and confirmed position (which is false until the server agrees)

            //update server with clients movement
            //clients direction / tick iteration number

            //receive the actual position of the character from the server
            /*check the adjustmentIteration number (current tick) and compare it to clients
                movement history and update the clients confirmed position to true if they match.
            */
            //Fix any discrepancy from clients predicted position and characters actual position sent by the server
            //if any discrepancy is found then move the client to the position sent by the server.

            //receive update from the server about clients current tick 
            //adjust current tick if need be
            //if current tick is behind the server adjust my current tick forward and process all messages 
            //resend previous message 
            /*if current tick is too far ahead then dont process any more ticks for 
                x ticks then begin to process clients movements again*/
            //if tick did not need to be adjusted then continue processing ticks as normal    

            this.currentClientTick++
        }, this.clientTickRate);
    }

    public get Character() {
        return this.character;
    }

    public SETCharacter(char) {
        this.character = char;
    }

    public setID(id: string): void {
        console.log("ID has been changed to: ", id);
        this.clientID = id;
    }

    connect(_client) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.createOverworld();
        clientController.client = _client;
        console.log(`User: ${clientController.client.username} is online. \n`);
        this.socket.emit($socketRoutes.REQUEST_CLIENT_ONLINE, this.clientID);
        clientController.characters = clientController.client.characters;
        clientController.sendViewCharacterSelection(clientController.client.characters);

        //TODO call startOverworldOnConnection with character.location
        clientController.startOverworldOnConnection();
        /* if (this.client.characters.at(0)) {
            console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).username}`);
        } */
    }

    sendViewCharacterSelection(ListOfCharacters: Array<any>) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.view.createCharacterSelectionButtons(ListOfCharacters);
    }

    characterSelectionCallback(data) {
        let clientController = ClientController.ClientControllerInstance;
        let characterPosition: number = data.detail;
        clientController.SETCharacter(clientController.characters.at(characterPosition));
        console.log(`User: ${clientController.client.username} is playing on ${clientController.character.username}`);
        let characterOBJ = ClientController.syncUsertoCharacter(clientController.character);
        clientController.socket.emit($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, characterOBJ, characterOBJ.location, this.clientID);
        clientController.OVERWORLD.Maps.forEach(map => {
            if (map.getMapName == clientController.character.location || clientController.character.location == null && map.getMapName == MapNames.GrassyField) {
                if (!clientController.character.location) {
                    clientController.character.location = MapNames.GrassyField;
                }
                map.setClientCharacter(clientController.character);
            }
        });
        clientController.addCharacterToOverworld(clientController.character, clientController.character.location);
    }

    createOverworld() {
        let clientController = ClientController.ClientControllerInstance;
        let grassyfield = new GameMap(clientController.grassyfieldConfig);
        let hallway = new GameMap(clientController.hallwayConfig);

        console.log("overworld created.");
        clientController.OVERWORLD = new Overworld_Test();
        clientController.OVERWORLD.addMap(grassyfield);
        clientController.OVERWORLD.addMap(hallway);
    }

    //TODO LOAD IN MAP
    startOverworldOnConnection(startMap: MapNames = MapNames.GrassyField) {
        let clientController = ClientController.ClientControllerInstance;
        if (clientController.OVERWORLD == null) {
            clientController.createOverworld();
        }
        clientController.socket.emit("requestOverworldGameObjects", startMap);
        console.log('Starting new Oveworld map');
        clientController.OVERWORLD.init(startMap);
    }

    updateGameObjects(gameObjects, updatedMap: MapNames) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.OVERWORLD.Maps.forEach(map => {
            if (map.getMapName == updatedMap) {
                map.syncGameObjects(gameObjects);
            }
        });
    }

    requestActiveServers() {
        let clientController = ClientController.ClientControllerInstance;
        clientController.socket.emit($socketRoutes.REQUEST_ACTIVE_SERVERS);
    }

    receiveActiveServers(serverRooms: Array<string>) {
        let clientController = ClientController.ClientControllerInstance;
        if (serverRooms.length < 0) {
            console.log(serverRooms + "is empty");
            return;
        }
        clientController.view.createServerSelectionButtons(serverRooms);
    }

    joinServer(serverRoom) {
        let clientController = ClientController.ClientControllerInstance;
        console.log("controller: Server room selected: " + serverRoom.detail);
        clientController.activeServer = serverRoom.detail;
        clientController.socket.emit($socketRoutes.REQUEST_JOIN_SERVER_ROOM, clientController.clientID, serverRoom.detail);
    }

    changeGameMap(map: MapNames) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.OVERWORLD.init(map);
    }

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

    syncOverworld(overworld: $syncOverworld) {
        //let matchFound = false;
        /*come up with a framework to do interpolation
          dependency injection or visitor pattern
          vector from server > visitor pattern that implements interpolation
          based on current direction continue moving non player controlled characters in that direction until you receive an update from the server
        */
        console.log("Received sync overworld data: " + overworld);
        this.OVERWORLD.Maps.forEach((map) => {

            if (map.getMapName == MapNames.GrassyField) {
                /* let newCharacters = this.findRecentlyAddedCharacters(map.activeCharacters, overworld.grassyfield.activePlayers)
    
                newCharacters.forEach(character => {
                    let createdCharacter = this.createCharacterFromCharacterDataI(character)
                    this.addCharacterToOverworld(createdCharacter, MapNames.GrassyField);
                });
    
                map.removeCharactersFromGameObjectsList(overworld.grassyfield.activePlayers, map) */

                map.syncActiveCharacters(overworld.grassyfield.activePlayers);

                if (!Array.isArray(overworld.grassyfield.gameObjects)) {
                    console.log("GameObjects grassyfield: ", overworld.grassyfield.gameObjects, " Type: ", typeof overworld.grassyfield.gameObjects)
                    let syncedOverworldGameObjects = Object.values(overworld.grassyfield.gameObjects);
                    let updatedObjects = [];

                    syncedOverworldGameObjects.forEach((character: $characterDataInterface) => {
                        if (character.name == this.Character.name || character.player == this.Character.player) {
                            updatedObjects.push(this.Character);
                        } else {
                            updatedObjects.push(this.createCharacterFromCharacterDataI(character as $characterDataInterface))
                        }
                    });
                    map.syncGameObjects(updatedObjects);

                } else {
                    let updatedObjects = [];
                    overworld.grassyfield.gameObjects.forEach((character) => {

                        if (character.username == ClientController.ClientControllerInstance.character.username) {

                            //  ClientController.ClientControllerInstance.character = this.createCharacterFromCharacterDataI(character);
                            //  map.setClientCharacter(ClientController.ClientControllerInstance.Character);
                            updatedObjects.push(ClientController.ClientControllerInstance.Character);

                        } else {

                            updatedObjects.push(this.createCharacterFromCharacterDataI(character));

                        }
                    })
                    map.syncGameObjects(updatedObjects);
                }
            }

            if (map.getMapName == MapNames.Hallway) {

                /* let drawNewCharacters = this.findRecentlyAddedCharacters(map.activeCharacters, overworld.hallway.activePlayers)
    
                drawNewCharacters.forEach(character => {
                    let createdCharacter = this.createCharacterFromCharacterDataI(character);
                    this.addCharacterToOverworld(createdCharacter, MapNames.Hallway);
                });
    
                map.removeCharactersFromGameObjectsList(overworld.hallway.activePlayers, map); */

                map.syncActiveCharacters(overworld.hallway.activePlayers);

                if (!Array.isArray(overworld.hallway.gameObjects)) {
                    console.log("GameObjects hallway: ", overworld.hallway.gameObjects, " Type: ", typeof overworld.hallway.gameObjects)
                    let syncedOverworldGameObjects = Object.values(overworld.hallway.gameObjects);
                    let updatedObjects = [];
                    syncedOverworldGameObjects.forEach((character) => {
                        updatedObjects.push(this.createCharacterFromCharacterDataI(character as $characterDataInterface))
                    });

                    map.syncGameObjects(updatedObjects);
                } else {
                    let updatedObjects = [];
                    overworld.hallway.gameObjects.forEach((character) => {
                        updatedObjects.push(this.createCharacterFromCharacterDataI(character));
                    })
                    map.syncGameObjects(updatedObjects);
                }
            }
        })

        //console.log("Received sync overworld response from the server.");
    }

    findRecentlyAddedCharacters(currentPlayers: Map<string, $characterDataInterface>, newPlayers: Map<string, $characterDataInterface>): Array<$characterDataInterface> {
        let newPlayersList = new Array<$characterDataInterface>();
        console.log("newPlayers: ", newPlayers, " Type: ", typeof newPlayers);

        if (typeof newPlayers === 'object' && !(newPlayers instanceof Map)) {
            newPlayers = new Map(Object.entries(newPlayers));
        }

        for (let player of newPlayers.values()) {
            if (!currentPlayers.has(player.name)) {
                console.log(player.name);
                newPlayersList.push(player);
            }
        }
        return newPlayersList;
    }

    /* syncOverworld(overworld) {
     
        let foundMatch = false;
     
        overworld.grassyField.gameObjects.forEach((character: GameObject) => {
            foundMatch = false;
            if (character instanceof Character) {
                for (let i = 0; i < this.OverworldMaps.grassyField.gameObjects.length; i++) {
     
                    if (character.username == this.OverworldMaps.grassyField.gameObjects[i].username) {
                        this.OverworldMaps.grassyField.gameObjects[i].x = character.x;
                        this.OverworldMaps.grassyField.gameObjects[i].y = character.y;
                        foundMatch = true;
                        break;
                    }
                }
            }
     
            if (!foundMatch) {
                this.addCharacterToOverworld((character as Character));
            }
     
        })
     
        window.OverworldMaps = this.OverworldMaps;
    } */

    createCharacterFromCharacterDataI(character: $characterDataInterface): Character {
        if (character.y >= 400) {
            character.y = 100;
        }

        let createdCharacter = new $Character({
            isPlayerControlled: false,
            x: character.x,
            y: character.y,
            name: character.name || character.username,
            xVelocity: $CharacterVelocity.xVelocity,
            yVelocity: $CharacterVelocity.yVelocity,
            width: character.width,
            height: character.height,
            sprite: new Sprite({
                gameObject: this,
                src: character.sprite.src || "/images/characters/players/erio.png"
            }),
            username: character.username,
            attributes: character.attributes,
            characterGender: character.characterGender,
            player: character.player,
            class: character.class,
            guild: character.guild,
            characterID: character.gameObjectID,
            items: character.items,
            direction: character.direction || "right",
        });
        return createdCharacter;
    }

    addCharacterToOverworld(character: $Character, map: MapNames = MapNames.GrassyField) {
        let clientController = ClientController.ClientControllerInstance;


        let gameObjects = null;

        let selectedMap = clientController.findOverWorldMapByName(map);

        if (selectedMap) {

            gameObjects = selectedMap.GameObjects;

        } else {

            console.log("Unable to find map.\nDefaulted user to Grassyfield map. ");
            gameObjects = clientController.findOverWorldMapByName(MapNames.GrassyField).GameObjects;

        }

        gameObjects.forEach((gameObject: GameObject) => {
            if (gameObject instanceof $Character) {
                if ((gameObject as $Character).username == character.username) {
                    console.log("Character is already exists in this map.");
                    return;
                }
            }
        });

        gameObjects.push(character);

    }

    private findOverWorldMapByName(searchingMap: MapNames): GameMap | null {
        let clientController = ClientController.ClientControllerInstance;
        let maps = clientController.OVERWORLD.Maps;

        for (let i = 0; i < maps.length; i++) {
            if (maps[i].getMapName == searchingMap) {
                return maps[i];
            }
        }
        return null;
    }

    //create an interface for obj
    static syncUsertoCharacter(obj) {
        let char = new $Character({
            isPlayerControlled: true,
            name: obj.username,
            x: Utils.withGrid(6),
            y: Utils.withGrid(6),
            sprite: new Sprite({ src: obj.src || "/images/characters/players/erio.png" }),
            width: obj.width,
            height: obj.height,
            direction: obj.direction || 'right',
            characterID: obj._id,
            username: obj.username,
            attributes: obj.attributes,
            class: obj.class,
            guild: obj.guild,
            items: obj.items,
            player: obj.player,
            location: obj.location || MapNames.GrassyField,
            xVelocity: $CharacterVelocity.xVelocity,
            yVelocity: $CharacterVelocity.yVelocity,
        });
        ClientController.ClientControllerInstance.SETCharacter(char);
        return char;
    }

    /**
     * @description See function name
     * @param character See parameter name
     * @param moveDirection See parameter name
     */
    public serverRequestMoveCharacter(character: $Character, moveDirection: $Direction) {
        //If moveDirection is valid than move the character in the given direction and change their sprite direction
        // console.log("character id:" + character.player + '\nclient character id:' + this.client.characters.at(0).player);
        //TODO: The check needs to be for Character Ids which are currently being assigned to 1.
        let clientController = ClientController.ClientControllerInstance;
        if (character.player == clientController.character.player) {

            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req")
                clientController.moveCharacter(moveDirection, character);
            } else {
                clientController.moveCharacter($Direction.STANDSTILL, character);
            }

            //console.log('ClientController func requestServerGameObjectMove\n Direction: ' + moveDirection);
            // If no direction than keep the sprite direction the same.
            //character.updateCharacterLocationAndAppearance({ arrow: moveDirection })
        }
    }

    /**
     * 
     * @param direction 
     * @param gameOBJ 
    */

    public moveCharacter(direction: $Direction, gameOBJ: $Character) {
        let clientController = ClientController.ClientControllerInstance;
        switch (direction) {
            case $Direction.UP:
                if (gameOBJ.y - 0.5 <= 10) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.UP, gameOBJ);
                }
                break;

            case $Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.DOWN, gameOBJ);
                }
                break;

            case $Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.LEFT, gameOBJ);
                }
                break;

            case $Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.RIGHT, gameOBJ);
                }
                break;

            default:
                clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, $Direction.STANDSTILL, gameOBJ);
        }
    }

    //Receives a list of characters from the server to update their positions
    syncPlayersMovements(charactersMovementData: Array<CharacterMovementData>) {
        let characterCreated: boolean = false;

        charactersMovementData.forEach((character) => {
            window.OverworldMaps.grassyField.gameObjects.forEach((char: GameObject) => {
                if (char instanceof $Character) {
                    console.log("username: " + character.characterObj.username + " searching username: " + char.username);
                    if (character.characterObj.username == char.username) {
                        char.updateCharacterLocationAndAppearance({ arrow: character.direction });
                        char.x = character.delta.x;
                        char.y = character.delta.y;
                        characterCreated = true;
                    }
                }
            });

            if (!characterCreated) {
                ClientController.ClientControllerInstance.addCharacterToOverworld(character.characterObj);
            }
        });
    }

    emit(event: string, data: any = false) {
        if (data)
            ClientController.ClientControllerInstance.socket.emit(event, data);
        ClientController.ClientControllerInstance.socket.emit(event);
        console.log("emitting event: ", event);
    }

    checkMessage(message: string) {
        let cleanMessage: any = '';
        if (message) {
            cleanMessage = message;
        }
        try {
            ClientController.ClientControllerInstance.sendMessage(cleanMessage.detail, ClientController.ClientControllerInstance.character.username);
        } catch (error) {
            alert('No character selected');
        }

    }

    sendMessage(message: string, user: string) {
        if (ClientController.ClientControllerInstance.activeServer) {
            ClientController.ClientControllerInstance.socket.emit($socketRoutes.REQUEST_MESSAGE, this.activeServer, message, user);
            return;
        }
        alert("Select a server to send a message.");
    }

    postMessage(message: string, username: string) {
        ClientController.ClientControllerInstance.view.postMessage(message, username);
    }

    async createCharacter(route: string, data: any): Promise<boolean> {
        try {
            console.log("sending data to server -ClientController");
            let characterData: $characterSignup = {
                username: data.detail.username,
                characterGender: data.detail.characterGender,
                player: "",
                x: 0,
                y: 0,
                direction: $Direction.RIGHT,
                sprite: data.detail.sprite,
                height: $CharacterSize.height,
                width: $CharacterSize.width,
                location: MapNames.GrassyField,
                xVelocity: $CharacterVelocity.xVelocity,
                yVelocity: $CharacterVelocity.yVelocity,
                gameObjectID: 0,
                name: data.detail.name,
            }

            console.log(data.detail);
            characterData = Object.assign(characterData, data.detail);
            let response = await this.networkProxy.postJSON(route, characterData);

            if (response && response.ok) {
                this.view.resetSignupForm();
                return Promise.resolve(true)
            }
            else {
                console.log("Something went wrong writing character, status: ", response?.status);
                return Promise.reject(false);
            }

        } catch (e) {
            console.log("Something went wrong writing character", e)
            return Promise.reject(false);
        }

    }

    //TODO
    disconnect() {
        console.log(`User: ${this.clientID} is offline.`)
    }


    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }

    //TODO
    async playerLogout() {
        this.socket.emit($socketRoutes.REQUEST_CLIENT_LOGOUT, this.clientID, this.character);
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
        } else {
            console.log('error');
        }
    }

}
ClientController.ClientControllerInstance;
