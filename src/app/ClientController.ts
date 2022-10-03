import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import { EventConstants as $events, ServerNameConstants as $servers } from '../constants/EventConstants.js';
import { StatusConstants as $StatusConstants } from "../constants/StatusConstants.js";
import { io, Socket } from "/socket.io-client/dist/socket.io.esm.min.js";
import { appendFile } from "fs";
import { CharacterCreationDataInterface as $characterSignup } from '../players/PlayerDataInterface.js'


interface ClientToServerEvents {
    playerJoinedServer: (data: number) => void;
    basicEmit: (a: number, b: string, c: number[]) => void;
}

interface ServerToClientEvents {
    withAck: (d: string, cb: (e: number) => void) => void;
}

class ClientController extends $OBSERVER {
    private view = $MainAppView;
    private networkProxy: NetworkProxy;
    private socket: any;
    private clientID: string = "";
    private client: any;

    constructor(networkProxy: NetworkProxy) {
        super();
        this.networkProxy = networkProxy;
        this.socket = io();
        const CharacterCreateRoute = '/player/savecharacter';

        this.socket.on("connected", this.testConnection);
        this.socket.on("playerJoinedServer", this.playerJoinedServer);
        this.socket.on("onlineClient", this.connect);
        this.socket.on("offline", this.disconnect);
        this.socket.on("clientID", this.setID);

        this.socket.emit('connection');
        this.socket.emit("online", this.clientID);


        this.listenForEvent($events.CHARACTER_CREATE, (e) => { this.createCharacter(CharacterCreateRoute, e); }, this.view);
        this.listenForEvent($events.LOGOUT, (e) => {
            this.playerLogout();
        }, this.view);

        //this.socket.on('playerJoinServer', this.playerJoinServer);
        //move to view
        document.querySelector('#joinServer')?.addEventListener('click', () => {
            let data = {
                id: this.clientID,
                serverRoom: $servers.ROOM1
            }
            this.socket.emit('playerJoinServer', data);
        })



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
        console.log(`User: ${this.client.username} is playing on ${this.client.characters.at(0).id}`)
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
