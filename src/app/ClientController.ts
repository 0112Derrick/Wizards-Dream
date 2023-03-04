import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants/StatusConstants.js";

import { appendFile } from "fs";
import { CharacterCreationDataInterface as $characterSignup } from '../players/PlayerDataInterface.js'
import { Character } from "../app/Character.js"
import { Utils } from "../app/Utils.js"
import { Overworld } from "./Overworld.js";
import { GameObject } from "GameObject.js";
import { DirectionInput, Direction } from "./DirectionInput.js";
import { CharacterMovementData } from "../players/interfaces/CharacterInterfaces.js";
import { Overworld_Test } from "OverworldMap.js";
import { MapNames } from "../constants/MapNames.js";

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
    private character: any;
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

    private OVERWORLD = new Overworld_Test();

    constructor(networkProxy: NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.init();

        //this.listenForEvent($events.START_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = false; this.OVERWORLD.startGameLoop(); }, this.view);
        //this.listenForEvent($events.STOP_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = true; }, this.view);
        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);

        this.listenForEvent($events.MESSAGE, (message) => { this.checkMessage(message) }, this.view)

        //this.socket.on('playerJoinServer', this.playerJoinServer);
    }

    async init() {
        // @ts-ignore

        this.socket = await io();
        this.OVERWORLD.init();
        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client) });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id) });
        this.socket.on("reconnect", () => { window.location.reload() });

        this.socket.emit('connection');
        this.socket.emit("online", this.clientID);

        //proof of concept events
        this.socket.on('movePlayer', () => { this.updatePlayer });
        this.socket.on('syncPlayer', (obj) => { this.syncPlayer(obj); });
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
    }


    addCharacterToOverworld(character: Character, map = "grassyfield") {
        switch (map) {
            case "grassyfield":
                let gameObjects = this.OverworldMaps.grassyField.gameObjects;
                gameObjects.forEach((object: GameObject) => {
                    if (object instanceof Character) {
                        if ((object as Character).username == character.username) {
                            return;
                        }
                    }
                });

                gameObjects.push(
                    new Character({
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
        window.OverworldMaps = this.OverworldMaps;
    }

    public get Character() {
        return this.character;
    }

    public set SETCharacter(char) {
        this.character = char;
    }

    static syncUsertoCharacter(obj) {
        let char = new Character({
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
        //clientController.SETCharacter(char);
        return char;
    }

    /**
     * @description See function name
     * @param character See parameter name
     * @param moveDirection See parameter name
     */
    public serverRequestMoveCharacter(character: Character, moveDirection: Direction) {
        //If moveDirection is valid than move the character in the given direction and change their sprite direction
        console.log("character id:" + character.player + '\nclient character id:' + this.client.characters.at(0).player);
        //TODO: The check needs to be for Character Ids which are currently being assigned to 1.
        if (character.player == this.client.characters.at(0).player) {

            if (moveDirection) {
                console.log(character.gameObjectID + " " + "movement req")
                this.moveCharacter(moveDirection, character);
            } else {
                this.moveCharacter(Direction.STANDSTILL, character);
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

    public moveCharacter(direction: Direction, gameOBJ: Character) {
        switch (direction) {
            case Direction.UP:
                if (gameOBJ.y - 0.5 <= 10) {
                    return;
                } else {
                    this.socket.emit("moveReq", Direction.UP, gameOBJ);
                }
                break;

            case Direction.DOWN:
                if (gameOBJ.y + 0.5 >= 200) {
                    return;
                } else {
                    this.socket.emit("moveReq", Direction.DOWN, gameOBJ);
                }
                break;

            case Direction.LEFT:
                if (gameOBJ.x - 0.5 <= 0) {
                    return;
                } else {
                    this.socket.emit("moveReq", Direction.LEFT, gameOBJ);
                }
                break;

            case Direction.RIGHT:
                if (gameOBJ.x + 0.5 >= 250) {
                    return;
                } else {
                    this.socket.emit("moveReq", Direction.RIGHT, gameOBJ);
                }
                break;

            default:
                this.socket.emit("moveReq", Direction.STANDSTILL, gameOBJ);
        }
    }

    syncPlayersMovements(charactersMovementData: Array<CharacterMovementData>) {
        let characterCreated: boolean = false;

        charactersMovementData.forEach((character) => {
            window.OverworldMaps.grassyField.gameObjects.forEach((char: GameObject) => {
                if (char instanceof Character) {
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
                this.addCharacterToOverworld(character.characterObj);
            }
        });
    }

    syncPlayer(obj) {
        let charJSON = ClientController.syncUsertoCharacter(obj).toJSON();
        this.socket.emit("characterCreated", charJSON);
    }


    emit(event: string, data: any = false) {
        if (data)
            this.socket.emit(event, data);
        this.socket.emit(event);
        console.log("emitting event: ", event);
    }


    async movePlayer(direction: string) {
        this.socket.emit("move", direction, this.socket.clientID);
        return direction;
    }


    updatePlayer(player) {
        console.log("player:", player.id, "moved to x: ", player.x, ', y: ', player.y)
    }

    checkMessage(message: string) {
        let cleanMessage: any = '';
        if (message) {
            cleanMessage = message;
        }
        this.sendMessage(cleanMessage.detail, this.client.characters.at(0).username)
    }

    sendMessage(message: string, user) {
        this.socket.emit("message", message, user)
    }

    postMessage(message: string, username) {
        this.view.postMessage(message, username);
    }

    public setID(id: string): void {
        this.clientID = id;
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

    testConnection(id) {
        console.log('connected ' + id);
    }

    connect(_client) {
        this.client = _client;
        console.log(`User: ${this.client.username} is online. \n`);
        if (this.client.characters.at(0))
            console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).username}`)
    }

    disconnect() {
        console.log(`User: ${this.clientID} is offline.`)
    }


    playerJoinedServer(data) {
        console.log(`You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `);
    }

    async playerLogout() {
        let response = await this.networkProxy.postJSON('/player/logout', null);
        if (response.ok) {
            console.log("Logged out");
            this.socket.emit("playerLogout", this.client);
        } else {
            console.log('error');
        }
    }

}
export const clientController = new ClientController(new $HTMLNetwork());
