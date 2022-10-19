import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants/StatusConstants.js";
//import { io, Socket } from "/socket.io-client/dist/socket.io.esm.min.js";
import { appendFile } from "fs";
import { CharacterCreationDataInterface as $characterSignup } from '../players/PlayerDataInterface.js'
import { Character } from "../app/Character.js"
import { Utils } from "../app/Utils.js"
import { Overworld } from "./Overworld.js";

interface ClientToServerEvents {
    playerJoinedServer: (data: number) => void;
    basicEmit: (a: number, b: string, c: number[]) => void;
}

interface ServerToClientEvents {
    withAck: (d: string, cb: (e: number) => void) => void;
}

(function () {
    const OVERWORLD = new Overworld({
        element: document.querySelector(".game-container")
    });
    OVERWORLD.init();
});


class ClientController extends $OBSERVER {
    private view = $MainAppView;
    private networkProxy: NetworkProxy;
    private socket: any;
    private clientID: string = "";
    private client: any;
    private character: any;
    private OverworldMaps = {
        grassyField: {
            lowerSrc: "/images/maps/Battleground1.png",
            upperSrc: "/images/maps/Battleground1.png",
            gameObjects: [],
            borders: [],
        }
    };

    private OVERWORLD = new Overworld({
        element: document.querySelector(".game-container")
    });

    constructor(networkProxy: NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        const CharacterCreateRoute = '/player/savecharacter';
        this.OVERWORLD.init();
        this.init();
        //this.socket = io();


        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);


        //this.socket.on('playerJoinServer', this.playerJoinServer);
        //move to view


        //     let xz = { x: 1, y: 1 }

        //     setInterval(async () => {
        //         let coord = await this.movePlayer(xz);
        //         xz.x++;
        //         xz.y++;
        //         //  this.socket.emit("move", coord, this.clientID);
        //     }, 5000);
    }

    async init() {
        // @ts-ignore

        this.socket = await io();

        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", (client) => { this.connect(client) });
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", (id) => { this.setID(id) });
        this.socket.on("reconnect", () => { window.location.reload() })


        this.socket.emit('connection');
        this.socket.emit("online", this.clientID);

        //proof of concept events
        this.socket.on('movePlayer', () => { this.updatePlayer });
        this.socket.on('syncPlayer', (obj) => { this.syncPlayer(obj); });
        this.socket.on("syncOverworld", (overworld) => { this.syncOverworld(overworld) })
        //end concepts


        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.clientID,
                serverRoom: $servers.ROOM1
            }
            this.socket.emit('playerJoinServer', data);
        })
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
    syncOverworld(overworld) {
        overworld.grassyField.gameObjects.forEach(char => {
            this.OverworldMaps.grassyField.gameObjects.push(new Character({
                isPlayerControlled: true,
                x: char.x,
                y: char.y,
                src: "/images/characters/players/erio.png",
                username: char.username,
                attributes: char.attributes,
                characterGender: char.gender,
                player: char.player,
                class: char.class,
                guild: char.guild,
                characterID: char.characterID,
                items: char.items,
                direction: "right",
            }))
        })
        window.OverworldMaps = this.OverworldMaps;
        this.OVERWORLD.init();
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
            direction: 'right',
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
        //console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).id}`)
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
        } else {
            console.log('error');
        }
    }

}
const clientController = new ClientController(new $HTMLNetwork());
