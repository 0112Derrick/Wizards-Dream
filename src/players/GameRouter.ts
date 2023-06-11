import { ServerSizeConstants as $serverSize, SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";
import { OverworldMap } from "../app/OverworldMap.js";
import { Character as $Character } from "../app/Character.js";
import { Overworld } from "../app/Overworld.js";
import { GameObject } from "../app/GameObject.js"
import { Utils, utilFunctions } from "../app/Utils.js";
import { Direction as $Direction } from "../app/DirectionInput.js";
import { CharacterMovementData, CharacterData_Direction } from "./interfaces/CharacterInterfaces.js";
import $Queue from ".././framework/Queue.js";
import { MapNames } from "../constants/MapNames.js";
import { Overworld_Server } from "./Overworld_Server.js";
import { OverWorld_MapI as $OverWorld_MapI, syncOverworldTransmit as $syncOverworld } from "./interfaces/OverworldInterfaces.js";
import { characterDataInterface as $characterDataInterface } from "./interfaces/CharacterDataInterface.js";
import { Socket } from "socket.io";
import { ClientObject as $ClientObject } from "./ClientObject.js";
import { MessageHeader as $MessageHeader, Message as $Message } from "../framework/MessageHeader.js"
import $MovementSystem from "../app/MovementSystem.js"
import { ServerMessages as $serverMessages } from "../constants/ServerMessages.js"
import WordFilter from "../app/WordFilter.js";
import { Skill as $Skill } from "../app/Skill.js";
import { SkillI as $SkillI } from "./interfaces/SkillInterface.js";
import { SkillTypes as $SkillTypes } from "../constants/SkillTypes.js";
import { MessageContentsI as $MessageContentsI } from "./interfaces/ServerInterfaces.js";
import * as SkillsData from "../constants/skills.json" assert {type: 'json'};
import fsModule from 'fs';
import { type } from "os";


const fs = fsModule.promises;

export enum ClientMapSlot {
    ClientSocket = 0,
    ClientOBJ = 1,
    ClientActiveCharacter = 2,
    ClientInputQue = 3,
    ClientSkillTree = 4,
}


export interface ClientDATA {
    id: string,
    arg: any
}

export class GameRouter {

    private static gameRouter: GameRouter;
    // private server: Map<number, Array<Map<string, Object>>> | null = null;
    private io: any;
    private moveRequestQue: $Queue<CharacterData_Direction> = new $Queue();
    private clientMessageQueue: $Queue<$MessageHeader> = new $Queue();
    private moveRequestTimer: number = 100;
    // temporary map storing client info until we can verify and connect that info to a clientsocket
    private clientInitMap: Map<string, Object> = new Map();

    // passed from req object when page is loaded
    public client: any | null = null;
    //passed from server on connection
    private clientSocket: any;
    //Set by server once a client connects
    private clientMap: Map<string, $ClientObject> = new Map();
    //Set by req obj 
    private clientIP: string;

    private skillsTree: $SkillI[] = [];

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

    private activeSockets: Array<string> = [];

    private constructor() {
        this.serverTick();
        fs.readFile("./src/constants/skills.json", "utf8").then((data) => {
            const jsonData = JSON.parse(data);
            this.skillsTree = [...jsonData];
        }).catch((err) => {
            console.log("Error: ", err);
        })
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
        //const deletedElement = 1;
        if (this.clientMap.has(_data.id)) {

            switch (slot) {
                case ClientMapSlot.ClientSocket:
                    this.clientMap.get(_data.id)?.setClientSocket(_data.arg as Socket);
                    //this.clientMap.get(_data.id)?.splice(ClientMapSlot.ClientSocket, deletedElement, _data.arg);
                    break;
                case ClientMapSlot.ClientOBJ:
                    this.clientMap.get(_data.id)?.setClientOBJ(_data.arg);
                    // this.clientMap.get(_data.id)?.splice(ClientMapSlot.ClientOBJ, deletedElement, _data.arg);
                    break;
                case ClientMapSlot.ClientActiveCharacter:
                    this.clientMap.get(_data.id)?.setActiveCharacter(_data.arg as $Character);
                    //this.clientMap.get(_data.id)?.splice(ClientMapSlot.ClientActiveCharacter, deletedElement, _data.arg as $Character);
                    break;
                case ClientMapSlot.ClientInputQue:
                    this.clientMap.get(_data.id)?.addInput(_data.arg.tick, _data.arg.input);
                    break;
                case ClientMapSlot.ClientSkillTree:
                    this.clientMap.get(_data.id)?.setSkillTree(_data.arg as $SkillI[]);
                    break;
                //this.clientMap.get(_data.id)?.splice(ClientMapSlot.ClientInputQue, deletedElement, (_data.arg as $Queue<$Direction>));
            }
        }
    }

    getClientMap() {
        return this.clientMap;
    }

    setActiveSockets(sockets: Array<string>): boolean {
        this.activeSockets = sockets;
        return true;
    }

    addToActiveSockets(socket: string): boolean {
        try {
            for (let currentSocket of GameRouter.GameRouterInstance.activeSockets) {
                if (currentSocket == socket) {
                    return false;
                }
            }

            GameRouter.GameRouterInstance.activeSockets.push(socket);
            return true;
        } catch (error) {
            return false;
        }
    }

    deleteFromActiveSocket(socket: string): boolean {
        for (let i = 0; i < GameRouter.GameRouterInstance.activeSockets.length; i++) {
            if (GameRouter.GameRouterInstance.activeSockets[i] == socket) {
                GameRouter.GameRouterInstance.activeSockets.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    getActiveSockets(): any {
        return this.activeSockets;
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
        _socket.on($socketRoutes.REQUEST_CLIENT_ACTION_MESSAGE, (message: $MessageHeader) => { this.addCharacterActionRequestToQueue(message); /*this.checkClientActionMessages(message)*/ })
        // _socket.on("requestOverworld", this.startServerRoom);
        // _socket.on("connection");

        _socket.on($socketRoutes.REQUEST_ACTIVE_SERVERS, this.sendServersList);
        //test events

        _socket.on($socketRoutes.REQUEST_CHARACTER_MOVEMENT, gameRouter.addCharacterMoveRequestsToQueue);
        _socket.on($socketRoutes.REQUEST_ADD_CREATED_CHARACTER, (character: any, map: MapNames, clientID: string) => {
            let implementsInterface = utilFunctions.checkIfObjectMeetsCharacterDataInterface(character); //this.implementsCharacterDataInterface(character)
            let char: $characterDataInterface = null;
            //this data should not come from the client but instead should be set by the server using the data from the db.
            if (implementsInterface) {
                char = {
                    name: character.name,
                    x: character.x,
                    y: character.y,
                    sprite: character.sprite,
                    width: character.width,
                    height: character.height,
                    direction: character.direction,
                    gameObjectID: character.gameObjectID,
                    username: character.username,
                    attributes: character.attributes,
                    class: character.class,
                    guild: character.guild,
                    items: character.items,
                    player: character.player,
                    unlockedSkills: character.unlockedSkills || [],
                    location: character.location,
                    xVelocity: character.xVelocity,
                    yVelocity: character.yVelocity,
                    friends: character.friends,
                    equipment: character.equipment,
                    characterGender: character.characterGender,
                };
            }
            //sets the active character
            if (char) {
                gameRouter.clientMap.has(clientID) ? gameRouter.setClientMap({ id: clientID, arg: char }, ClientMapSlot.ClientActiveCharacter) : console.log("Unknown Client");

                console.log("id: ", clientID, " active character: ", gameRouter.clientMap.get(clientID).getActiveCharacter().username);
            }

            //console.log("character not type Character: ", character);

            //Adds the character to the overworld
            gameRouter.addCharacterToOverworld(character, map);
        });
        // end

        this.createServerRooms();

        /* 
                //Move characters at a set interval.
                setInterval(() => {
                    if (!GameRouter.GameRouterInstance.moveRequestQue.isEmpty()) {
                        GameRouter.GameRouterInstance.moveCharacter(GameRouter.GameRouterInstance.moveRequestQue);
                    }
                    //this.syncOverworld();
                }, GameRouter.GameRouterInstance.getMoveRequestIntervalTime()); */

    }


    createMessageHeaders() {
        throw new Error("Method not implemented.")
    }

    createMessageHeadersForActiveClients(): Array<{ id: string, messageHeader: $MessageHeader }> {
        let serverMessageHeaders: Array<{ id: string, messageHeader: $MessageHeader }> = [];
        let tickAdjustments = new Map<string, number>();

        if (!this.clientMessageQueue.isEmpty()) {
            let que = this.clientMessageQueue.toArray();

            que.forEach((client) => {
                let foundClient = this.getClientMap().get(client.id);
                let foundClientIterationNumb = this.getClientMap().get(client.id).getAdjustmentIteration();
                if (!foundClient) {
                    console.log("No client found.");
                    return;
                }
                if (client.adjustmentIteration != foundClientIterationNumb) {
                    tickAdjustments.set(client.id, foundClientIterationNumb);
                }
            });
        }

        for (let client of this.getClientMap().values()) {
            let id = client.getClientSocket().id;
            if (tickAdjustments.has(id)) {
                let messageHeader = this.createMessageHeader(id, client.getAdjustmentIteration(), null, tickAdjustments.get(id))
                serverMessageHeaders.push({ id: id, messageHeader: messageHeader })
            } else {
                let messageHeader = this.createMessageHeader(id, client.getAdjustmentIteration(), null, null);
                serverMessageHeaders.push({ id: id, messageHeader: messageHeader })
            }
        }

        return serverMessageHeaders;
    }

    createMessageHeader(id: string, adjustmentIteration: number, content: $Message[] | null, tickAdjustment: number): $MessageHeader {
        return new $MessageHeader(adjustmentIteration, content, id, tickAdjustment);
    }

    checkIfClientHasActiveSocketConnection(id: any): boolean {
        let sockets = GameRouter.GameRouterInstance.getActiveSockets()
        for (let socket of sockets) {
            if (id == socket) {
                return true
            }
        }
        return false;
    }

    serverTick() {
        // Server Tick
        setInterval(() => {
            let serverMessageHeaders: { id: string, messageHeader: $MessageHeader }[];
            let serverMessages: $Message[] = new Array<$Message>();


            while (!this.clientMessageQueue.isEmpty()) {

                serverMessageHeaders = this.createMessageHeadersForActiveClients();

                let messageHeader = this.clientMessageQueue.dequeue();

                let client = this.getClientMap().get(messageHeader.id);

                let clientCharacter = client.getActiveCharacter();

                let message: $Message;

                message = messageHeader.contents.at(0);

                const { action, worldWidth, worldHeight, mapMinWidth, mapMinHeight } = (message.action as $MessageContentsI);

                if (!message.action) {
                    break;
                }

                if (message.type == $serverMessages.Movement) {

                    //console.log("client character:", clientCharacter);
                    if (typeof action !== "string") {
                        return;
                    }

                    if (!this.checkIfClientHasActiveSocketConnection(message.id)) {
                        console.log("Client not connected");
                        return;
                    }

                    let coords = $MovementSystem.updateCharacterPosition(clientCharacter, action, worldWidth, worldHeight, mapMinWidth, mapMinHeight);

                    let clientPosition = {
                        username: clientCharacter.username,
                        id: clientCharacter.gameObjectID,
                        location: clientCharacter.location,
                        coords: coords,
                    }

                    console.log(clientPosition);

                    serverMessages.push(new $Message($serverMessages.Movement, clientPosition, message.tick, null));

                } else {
                    //write code for tracking skills here.
                    /**
                     * 
                     * Check if player can use the skill I.E its unlocked or if its on cooldown or if they have the available skill points. 
                     *  - Check the skills document for the correct skill stats. 
                     *  - Render the usuable skill on players' screens.(Add skill to gameObjects list).
                     * 
                     * Check skill for collision:
                     *  - Check skill is a heal or an attack
                     *      - If skill is a heal: 
                     *          - Check if its a self heal skill
                     *              - Update players with the % the player healed by.
                     *          - Check if theres a collision for the heal and targeted player.
                     *              -  Update players with the % the player(s) healed by.
                     *              - Update players with their current hp.
                     *      - If skill is an atack
                     *          - Detect any collisions amongst skills and gameObjects
                     *              - Calculate the damage dealt
                     *              - Update players with their current hp.
                     */

                    //Check skill type
                    if (typeof action == "string") {
                        return;
                    }

                    let skill = message.action;

                    if (!this.checkIfCharacterCanUseSkill(skill, message.id)) {
                        return;
                    };

                    //add skill to gameObjects list

                    //detect collisions for gameObjects

                    if (action.SkillType == $SkillTypes.HEAL) {
                        //implement code for healing logic.
                    }
                    if (action.SkillType == $SkillTypes.MELEE) {
                        //implement code for melee logic.
                    }
                    if (action.SkillType == $SkillTypes.RANGED) {
                        //implement code for ranged logic.
                    }
                }
            }
            if (serverMessageHeaders)
                serverMessageHeaders.forEach((messageHeader: { id: string, messageHeader: $MessageHeader }) => {
                    let id: string = null;
                    let header: $MessageHeader = null;

                    if ((typeof messageHeader.id) == 'string') {
                        id = messageHeader.id as string;
                    }

                    if (messageHeader.messageHeader instanceof $MessageHeader) {
                        header = messageHeader.messageHeader as $MessageHeader;
                    }

                    header.updateContents(serverMessages);

                    GameRouter.GameRouterInstance.io.to(id).emit($socketRoutes.RESPONSE_CLIENT_ACTION_MESSAGE, header);
                });

            // GameRouter.GameRouterInstance.setClientMap({ id: id, arg: { tick: Message.tick, input: Message.input } }, ClientMapSlot.ClientInputQue)

            //message headers would need the clients id to send them the updates about their tick

            //then all messages for that tick should be sent to the client

            /**
             * For every active player create a new message header
             * detailing wheter or not their message was received on time of if a message 
             *  timing needs to be adjusted.
             * In the case of a message timing needing to be adjusted 
             * forward: tell the client the message was dropped and then tell them to process 
             *  the previous ticks to catch up append an iteration number so the client can tell
             *  when they have completed this process.
             * 
             * case backwards: tell the client to not process anymore ticks for x amount of ticks
             *  so that way its not too far ahead of the server tick.
             */

            this.currentServerTick++;
        }, this.serverTickRate);

    }

    checkClientMessagesForIncorrectTickTiming(message: $MessageHeader) {
        /**
         * TODO
         * Receive client id
         * Search through active clients for a matching ID
         * Check clients tick and flag it for an adjustment if needed.
         * Update clients Messages e.g: GameRouter.GameRouterInstance.setClientMap({ id: id, arg: { tick: Message.tick, input: Message.input } }, ClientMapSlot.ClientInputQue)
         * Que clients message 
         */
        const clientTickAdjustment = 4;

        if (!message) {
            console.log("Something went wrong with receiving the message.")
            return;
        }

        let clientId = message.id;

        if (!this.getClientMap().get(clientId)) {
            console.log("Client does not exist.");
            return;
        }

        let clientTick = message.contents.at(0).tick;

        switch (this.clientsTickChecker(clientTick)) {
            case 1:
                console.log("Message was dropped by the server. Tick was behind schedule. " + "\n client tick:" + clientTick + " server tick: " + this.currentServerTick);
                this.adjustClientsTick((this.currentServerTick + clientTickAdjustment) - clientTick, clientId);
                break;

            case 2:
                console.log("Client is too far ahead of the server." + "\n client tick:" + clientTick + " server tick: " + this.currentServerTick);
                this.adjustClientsTick((this.currentServerTick + clientTickAdjustment) - clientTick, clientId);
                break;

            default:
                console.log("Clients message was received successfully");
        }

        /*  if (client.getAdjustmentIteration() != message.adjustmentIteration) {
             //send updated iteration number in response message
             //iteration number correlates to a tick amount needing to be changed
         } */

    }

    //Receive clients messages and queue them
    addCharacterActionRequestToQueue(message: $MessageHeader) {
        this.clientMessageQueue.add(message);
    }

    //create an enum or constant for the return type
    clientsTickChecker(tick: number): number {
        const clientTickAdjustment = 4;

        if (tick < this.currentServerTick) {
            return 1;
        }

        if (tick > this.currentServerTick + clientTickAdjustment) {
            return 2;
        }
        return 0;
    }

    adjustClientsTick(tickAdjustmentAmount: number, id: string) {
        //let gameRouter = GameRouter.GameRouterInstance;
        let client = undefined;

        if (!this.getClientMap().has(id)) {
            console.log("Client not found.");
            return;
        }

        client = this.getClientMap().get(id);
        client.incrementAdjustmentIteration();
        client.setAdjustedTick(client.getAdjustmentIteration(), tickAdjustmentAmount);
    }

    //sends an array of arrays with server names
    sendServersList() {
        let gameRouter = GameRouter.GameRouterInstance;
        gameRouter.io.emit($socketRoutes.RESPONSE_ACTIVE_SERVERS, [...gameRouter.serverRooms]);
    }

    checkIfCharacterCanUseSkill(skill: $SkillI, id: string): boolean {

        if (!this.clientMap.has(id)) {
            return false;
        }

        let clientOBJ = this.clientMap.get(id);

        let foundSkill = clientOBJ.findUsableSkill(skill.Name);

        if (!foundSkill) {
            return false;
        }

        let clientCharacter = this.clientMap.get(id).getActiveCharacter();
        //check clients skill points if they have over the required amount they can use the skill
        if (!clientCharacter) {
            return false;
        }

        if (foundSkill.Dependencies.class != null && foundSkill.Dependencies.class != clientCharacter.class) {
            return false;
        }

        if (foundSkill.Dependencies.costCategory.length == 0) {
            return true;
        }

        for (let costCategory of foundSkill.Dependencies.costCategory) {
            if (costCategory.toLowerCase() == "sp") {
                if (clientCharacter.attributes.sp >= foundSkill.Dependencies.costAmount) {
                    return true;
                };
            }

            if (costCategory.toLowerCase() == "hp") {
                if (clientCharacter.attributes.hp > foundSkill.Dependencies.costAmount) {
                    return true;
                };
            }
        }

        return false;
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
                activePlayers: Object.fromEntries(overworld.grassyfield.activePlayers.entries()),
                gameObjects: [...overworld.grassyfield.gameObjects],
            },
            hallway: {
                name: MapNames.Hallway,
                activePlayers: Object.fromEntries(overworld.hallway.activePlayers.entries()),
                gameObjects: [...overworld.hallway.gameObjects],
            }
        }
        console.log("Synced Overworld maps data with client");
        gameRouter.io.emit($socketRoutes.RESPONSE_SYNC_OVERWORLD, syncedOverworld);
    }

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
        throw new Error("Not implemented.");
    }

    serverRoomFull() {
        throw new Error("Not implemented.");
    }



    playerJoinServer(playerID: string, server: string) {
        let gameRouter = GameRouter.GameRouterInstance;
        try {
            let socket = gameRouter.clientMap.get(playerID).getClientSocket();
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

    disconnectPlayer(id: any) {
        let gameRouter = GameRouter.GameRouterInstance;
        let characterOBJ = gameRouter.clientMap.get(id);
        let character: $characterDataInterface;
        try {
            character = characterOBJ.getActiveCharacter();
            if (!("location" in character)) {
                console.log("Character location not set.")
                return;
            }
        } catch (error) {
            console.log(error);
            return;
        }


        let map = gameRouter.Overworld.maps.get(character.location);
        let foundCharacter = utilFunctions.findObjectByNameInArray(character.name, map.gameObjects);
        if (!foundCharacter) {
            return;
        }

        let arr = utilFunctions.removeObjectFromArray(map.gameObjects, "name", foundCharacter.name);

        if (!arr) {
            return;
        }

        map.gameObjects = arr;
        let delCharacter = map.activePlayers.delete(foundCharacter.name);
        if (delCharacter) { console.log(`${foundCharacter.name} is no longer active: ${delCharacter}`) }

        let result = gameRouter.clientMap.delete(id);
        console.log("data cleaned: ", result);
        gameRouter.syncOverworld();

    }


    //TODO update all clients and server to remove the character from active characters
    handlePlayerDisconnection(client, clientID) {
        GameRouter.GameRouterInstance.disconnectPlayer(clientID);

    }

    //TODO update all clients and server to remove the character from active characters
    playerLogout(id: any) {
        let gameRouter = GameRouter.GameRouterInstance;
        let characterOBJ = gameRouter.clientMap.get(id);
        let character: $characterDataInterface;
        try {
            if (!characterOBJ) {
                return
            }
            character = characterOBJ.getActiveCharacter();
            if (!character) { return }
            if (!("location" in character)) {
                console.log("Character location not set.")
                return;
            }
        } catch (error) {
            console.log(error);
            return;
        }
        gameRouter.io.emit($socketRoutes.RESPONSE_OFFLINE_CLIENT, character);
        gameRouter.disconnectPlayer(id);
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
            let wordFilter = new WordFilter();
            if (wordFilter.isProfane(message)) {
                cleanMessage = wordFilter.replaceProfane(message, '*');
            } else {
                cleanMessage = message;
            }
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
            if (utilFunctions.checkIfObjectMeetsCharacterDataInterface(gameObj)) {
                if ((gameObj as $characterDataInterface).username == character.username) {
                    console.log(`${character.username} already exists in ${overworld.maps.get(overworldMap).name} map gameObjects list.`);
                    return;
                }
            }
        });

        overworld.maps.get(overworldMap).gameObjects.push(character);

        gameRouter.syncOverworld();
    }

    //TODO update characters class to have character location to speed this function up
    removeCharacterFromOverworld(character: $characterDataInterface): void {
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

    addCharacterMoveRequestsToQueue(characterMovingDirection: $Direction, characterObject: $Character) {
        let queue = GameRouter.GameRouterInstance.getMoveRequestQueue();
        queue.add({
            direction: characterMovingDirection,
            characterObj: characterObject,
        });
    }

}

