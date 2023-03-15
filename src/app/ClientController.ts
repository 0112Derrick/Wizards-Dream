import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants/StatusConstants.js";

import { appendFile } from "fs";
import { CharacterCreationDataInterface as $characterSignup } from '../players/PlayerDataInterface.js'
import { Character as $Character } from "../app/Character.js"
import { Utils } from "../app/Utils.js"
import { Overworld } from "./Overworld.js";
import { GameObject } from "GameObject.js";
import { DirectionInput, Direction } from "./DirectionInput.js";
import { CharacterMovementData } from "../players/interfaces/CharacterInterfaces.js";
import { GameMap, Overworld_Test } from "./OverworldMap.js";
import { MapNames } from "../constants/MapNames.js";
import { MapConfigI } from "../players/interfaces/OverworldInterfaces.js";
import { OverworldMapsI } from "../players/interfaces/OverworldInterfaces.js";

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


class ClientController extends $OBSERVER {
    private view = $MainAppView;
    private networkProxy: NetworkProxy;
    private socket: any;
    private clientID: string = "";
    private client: any;
    private character: any = null;
    private characters: Array<any> = [];
    private static clientController: ClientController = null;


    private grassyfieldConfig: MapConfigI = {
        gameObjects: [],
        activeCharacters: null,
        name: MapNames.GrassyField,
        lowerImageSrc: '/images/maps/Battleground1.png',
        upperImageSrc: '/images/maps/Battleground1.png',
        element: document.querySelector(".game-container"),
        canvas: document.querySelector(".game-container").querySelector(".game-canvas"),

    }
    private hallwayConfig: MapConfigI = {
        gameObjects: [],
        activeCharacters: null,
        name: MapNames.Hallway,
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

        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message) }, this.view)

        //this.socket.on('playerJoinServer', this.playerJoinServer);
    }

    public static get ClientControllerInstance(): ClientController {

        if (this.clientController == null) {
            this.clientController = new ClientController(new $HTMLNetwork());
        }
        return this.clientController;
    }


    async init() {
        // @ts-ignore

        this.socket = await io();
        //this.OVERWORLD.init();

        this.socket.on("startOverworld", this.startOverworldOnConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client) });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id) });
        this.socket.on("reconnect", () => { window.location.reload() });
        this.socket.on("newServerWorld", () => { this.createOverworld });
        this.socket.on("updatedGameObjects", (gameObjects, map: MapNames) => {
            this.updateGameObjects;
        });
        //this.socket.emit('connection');
        this.socket.emit("online", this.clientID);

        //proof of concept events
        //this.socket.on('movePlayer', () => { this.updatePlayer });
        this.socket.on('syncPlayer', (ListOfCharacters) => { this.sendViewCharacterSelection(ListOfCharacters); });
        this.socket.on("syncOverworld", (overworld) => { this.syncOverworld(overworld) })
        this.socket.on("syncPlayersMovements", (charactersMovementData: Array<CharacterMovementData>) => { this.syncPlayersMovements(charactersMovementData) })
        this.socket.on("globalMessage", (message: string, username: string) => { this.postMessage(message, username) })
        //end concepts

        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.clientID,
                serverRoom: $servers.ROOM1
            }
            this.socket.emit('playerJoinServer', data);
        });

        //TODO: setInterval(){(character) => {save character} ,time}

    }

    connect(_client) {
        let clientController = ClientController.ClientControllerInstance;
        clientController.client = _client;
        console.log(`User: ${clientController.client.username} is online. \n`);
        clientController.characters = clientController.client.characters;
        clientController.sendViewCharacterSelection(clientController.client.characters);
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
        if (ClientController.ClientControllerInstance.OVERWORLD == null) {
            clientController.createOverworld();
        }

        clientController.socket.emit("requestOverworldGameObjects", startMap);
        console.log('Starting new Oveworld map');
        ClientController.ClientControllerInstance.OVERWORLD.init(startMap);
    }

    updateGameObjects(gameObjects, updatedMap: MapNames) {
        ClientController.ClientControllerInstance.OVERWORLD.Maps.forEach(map => {
            if (map.getMapName == updatedMap) {
                map.gameObjects = gameObjects;
            }
        });
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

    public get Character() {
        return this.character;
    }

    public SETCharacter(char) {
        this.character = char;
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
        let charJSON = ClientController.syncUsertoCharacter(clientController.character).toJSON();
        clientController.socket.emit("characterCreated", charJSON);
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
        });
        clientController.SETCharacter(char);
        return char;
    }

    /**
     * @description See function name
     * @param character See parameter name
     * @param moveDirection See parameter name
     */
    public serverRequestMoveCharacter(character: $Character, moveDirection: Direction) {
        //If moveDirection is valid than move the character in the given direction and change their sprite direction
        console.log("character id:" + character.player + '\nclient character id:' + this.client.characters.at(0).player);
        //TODO: The check needs to be for Character Ids which are currently being assigned to 1.
        let clientController = ClientController.ClientControllerInstance;
        if (character.player == this.client.characters.at(0).player) {

            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req")
                clientController.moveCharacter(moveDirection, character);
            } else {
                clientController.moveCharacter(Direction.STANDSTILL, character);
            }

            console.log('ClientController func requestServerGameObjectMove\n Direction: ' + moveDirection);
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
                    clientController.socket.emit("moveReq", Direction.UP, gameOBJ);
                }
                break;

            case Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                } else {
                    clientController.socket.emit("moveReq", Direction.DOWN, gameOBJ);
                }
                break;

            case Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                } else {
                    clientController.socket.emit("moveReq", Direction.LEFT, gameOBJ);
                }
                break;

            case Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                } else {
                    clientController.socket.emit("moveReq", Direction.RIGHT, gameOBJ);
                }
                break;

            default:
                clientController.socket.emit("moveReq", Direction.STANDSTILL, gameOBJ);
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
                clientController.addCharacterToOverworld(character.characterObj);
            }
        });
    }

    emit(event: string, data: any = false) {
        if (data)
            clientController.socket.emit(event, data);
        clientController.socket.emit(event);
        console.log("emitting event: ", event);
    }

    checkMessage(message: string) {
        let cleanMessage: any = '';
        if (message) {
            cleanMessage = message;
        }
        clientController.sendMessage(cleanMessage.detail, clientController.character.username)
    }

    sendMessage(message: string, user) {
        clientController.socket.emit("message", message, user)
    }

    postMessage(message: string, username) {
        clientController.view.postMessage(message, username);
    }

    public setID(id: string): void {
        clientController.clientID = id;
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
        this.socket.emit("playerLogout", this.client);
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
        } else {
            console.log('error');
        }
    }

}
export const clientController = new ClientController(new $HTMLNetwork());
