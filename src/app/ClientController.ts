import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";

import { appendFile } from "fs";
import { CharacterCreationDataInterface as $characterSignup } from '../players/interfaces/PlayerDataInterface.js'
import { Character as $Character } from "../app/Character.js"
import { Utils } from "../app/Utils.js"
import { Overworld } from "./Overworld.js";
import { GameObject } from "GameObject.js";
import { DirectionInput, Direction } from "./DirectionInput.js";
import { CharacterMovementData } from "../players/interfaces/CharacterInterfaces.js";
import { GameMap } from "./GameMap.js";
import { Overworld_Test } from "./Overworld_Test.js";
import { MapNames } from "../constants/MapNames.js";
import { MapConfigI } from "../players/interfaces/OverworldInterfaces.js";
import { OverworldMapsI } from "../players/interfaces/OverworldInterfaces.js";
import { Socket } from "socket.io-client";


interface ClientToServerEvents {
    playerJoinedServer: (data: number) => void;
    basicEmit: (a: number, b: string, c: number[]) => void;
}

interface ServerToClientEvents {
    withAck: (d: string, cb: (e: number) => void) => void;
}

/* (function () {
    const OVERWORLD = new Overworld({
        element: document.querySelector(".game-container")
    });
    OVERWORLD.init();
}); */


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

    private grassyfieldConfig: MapConfigI = {
        gameObjects: [],
        activeCharacters: null,
        name: MapNames.GrassyField,
        mapMinHeight: 500,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground1.png',
        upperImageSrc: '/images/maps/Battleground1.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
    }
    private hallwayConfig: MapConfigI = {
        gameObjects: [],
        activeCharacters: null,
        name: MapNames.Hallway,
        mapMinHeight: 0,
        mapMinWidth: 20,
        lowerImageSrc: '/images/maps/Battleground2.png',
        upperImageSrc: '/images/maps/Battleground2.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),
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
                    //this.connectSocket();
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
            this.clientID = this.socket.id;
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        })
    }

    async init() {
        // @ts-ignore

        this.connectSocket().then(() => {
            // this.socket.on("startOverworld", this.startOverworldOnConnection);
            this.socket.on($socketRoutes.RESPONSE_CLIENT_JOINED_SERVER, this.playerJoinedServer);
            this.socket.on($socketRoutes.RESPONSE_ONLINE_CLIENT, (client) => { this.connect(client) });
            this.socket.on($socketRoutes.RESPONSE_OFFLINE_CLIENT, this.disconnect);
            //this.socket.on($socketRoutes.RESPONSE_CLIENT_ID, (id) => { this.setID(id) });
            this.socket.on($socketRoutes.RESPONSE_RECONNECT_CLIENT, () => {
                if (!document.hidden) {
                    window.location.reload();
                }
            });
            // this.socket.on("newServerWorld", () => { this.createOverworld });
            this.socket.on($socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS, (gameObjects, map: MapNames) => {
                this.updateGameObjects;
            });
            //this.socket.emit('connection');

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
        //this.socket = await io();
        //this.OVERWORLD.init();

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

    public get Character() {
        return this.character;
    }

    public SETCharacter(char) {
        this.character = char;
    }

    public setID(id: string): void {
        this.clientID = id;
    }

    connect(_client) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.client = _client;
        console.log(`User: ${clientController.client.username} is online. \n`);
        this.socket.emit($socketRoutes.REQUEST_CLIENT_ONLINE, this.clientID);
        clientController.characters = clientController.client.characters;
        clientController.sendViewCharacterSelection(clientController.client.characters);
        clientController.createOverworld();
        //TODO call startOverworldOnConnection with character.location
        clientController.startOverworldOnConnection();
        /* if (this.client.characters.at(0)) {
            console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).username}`);
        } */
    }

    createOverworld() {
        let clientController = ClientController.ClientControllerInstance;
        let grassyfield = new GameMap(clientController.grassyfieldConfig);
        let hallway = new GameMap(clientController.hallwayConfig);

        console.log("overworld created.")
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
                map.gameObjects = gameObjects;
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

    syncOverworld(overworld) {
        let matchFound = false;
        /*come up with a framework to do interpolation
          dependency injection or visitor pattern
          vector from server > visitor pattern that implements interpolation
          based on current direction continue moving non player controlled characters in that direction until you receive an update from the server
        */
        //sss
        console.log("Received sync overworld response from the server.");
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



    addCharacterToOverworld(character: $Character, map: MapNames = MapNames.GrassyField) {
        let clientController = ClientController.ClientControllerInstance;
        switch (map) {

            case MapNames.GrassyField:
                //  let gameObjects = this.OverworldMaps.grassyField.gameObjects;
                let gameObjects = null;

                gameObjects = clientController.findOverWorldMapByName(map).gameObjects;

                if (!gameObjects) {
                    console.log("Map not found");
                    return;
                }

                gameObjects.forEach((object: GameObject) => {
                    if (object instanceof $Character) {
                        if ((object as $Character).username == character.username) {
                            console.log("Character is already exists in this map.");
                            return;
                        }
                    }
                });

                gameObjects.push(
                    new $Character({
                        isPlayerControlled: true,
                        x: character.x,
                        y: character.y,
                        xVelocity: character.xVelocity || 0,
                        yVelocity: character.yVelocity || 0,
                        width: character.width,
                        height: character.height,
                        src: "/images/characters/players/erio.png",
                        username: character.username,
                        attributes: character.attributes,
                        characterGender: character.characterGender,
                        player: character.player,
                        class: character.class,
                        guild: character.guild,
                        characterID: character.gameObjectID,
                        items: character.items,
                        direction: character.direction || "right",

                    })
                );
                break;
        }
        // window.OverworldMaps = this.OverworldMaps;
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

    //TODO FIX CHARACTERSELECTION
    sendViewCharacterSelection(ListOfCharacters: Array<any>) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.view.createCharacterSelectionButtons(ListOfCharacters);
    }

    characterSelectionCallback(data) {
        let clientController = ClientController.ClientControllerInstance;
        let characterPosition: number = data.detail;
        clientController.SETCharacter(clientController.characters.at(characterPosition));
        console.log(`User: ${clientController.client.username} is playing on ${clientController.character.username}`);
        //let charJSON = ClientController.syncUsertoCharacter(clientController.character).toJSON();
        //clientController.socket.emit("characterCreated", charJSON);
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

    static syncUsertoCharacter(obj) {
        let char = new $Character({
            isPlayerControlled: true,
            x: Utils.withGrid(6),
            y: Utils.withGrid(6),
            src: "/images/characters/players/erio.png",
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
            xVelocity: obj.xVelocity || 5,
            yVelocity: obj.yVelocity || 5,
        });
        ClientController.ClientControllerInstance.SETCharacter(char);
        return char;
    }

    /**
     * @description See function name
     * @param character See parameter name
     * @param moveDirection See parameter name
     */
    public serverRequestMoveCharacter(character: $Character, moveDirection: Direction) {
        //If moveDirection is valid than move the character in the given direction and change their sprite direction
        // console.log("character id:" + character.player + '\nclient character id:' + this.client.characters.at(0).player);
        //TODO: The check needs to be for Character Ids which are currently being assigned to 1.
        let clientController = ClientController.ClientControllerInstance;
        if (character.player == clientController.character.player) {

            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req")
                clientController.moveCharacter(moveDirection, character);
            } else {
                clientController.moveCharacter(Direction.STANDSTILL, character);
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

    public moveCharacter(direction: Direction, gameOBJ: $Character) {
        let clientController = ClientController.ClientControllerInstance;
        switch (direction) {
            case Direction.UP:
                if (gameOBJ.y - 0.5 <= 10) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.UP, gameOBJ);
                }
                break;

            case Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.DOWN, gameOBJ);
                }
                break;

            case Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.LEFT, gameOBJ);
                }
                break;

            case Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                } else {
                    clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.RIGHT, gameOBJ);
                }
                break;

            default:
                clientController.socket.emit($socketRoutes.REQUEST_CHARACTER_MOVEMENT, Direction.STANDSTILL, gameOBJ);
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
                username: "",
                characterGender: "",
                player: "",
                x: 5,
                y: 5,
                direction: "right",
                sprite: "",
                height: 32,
                width: 32,
                location: MapNames.GrassyField,
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
