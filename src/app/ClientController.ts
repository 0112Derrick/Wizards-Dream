import { View as $MainAppView } from "./ClientView.js";
import $OBSERVER from "../framework/Observer.js";
import NetworkProxy from "../network/NetworkProxy.js";
import $HTMLNetwork from "../network/HTML-Proxy.js";
import {
  EventConstants as $events,
  ServerNameConstants as $servers,
} from "../constants/EventConstants.js";
import { SocketConstants as $socketRoutes } from "../constants/ServerConstants.js";

import { appendFile } from "fs";
import {
  CharacterCreationDataInterface as $characterSignup,
  characterDataInterface as $characterDataInterface,
  inputHistory as $inputHistory,
} from "../game-server/interfaces/CharacterDataInterface.js";
import { Character as $Character, Character } from "../app/Character.js";
import { Utils, utilFunctions } from "../app/Utils.js";
import { GameObject as $GameObject } from "./GameObject.js";
import { DirectionInput, Direction as $Direction } from "./DirectionInput.js";
import { CharacterMovementData } from "../game-server/interfaces/CharacterInterfaces.js";
import { GameMap } from "./GameMap.js";
import { Overworld_Test } from "./Overworld_Test.js";
import { MapNames } from "../constants/MapNames.js";
import {
  MapConfigI,
  syncOverworld as $syncOverworld,
  syncOverworldTransmit as $syncOverworldTransmit,
} from "../game-server/interfaces/OverworldInterfaces.js";
import { OverworldMapsI } from "../game-server/interfaces/OverworldInterfaces.js";
import { Socket } from "socket.io-client";
import {
  MessageHeader as $MessageHeader,
  Message as $Message,
  Message,
} from "../framework/MessageHeader.js";
import {
  CharacterVelocity as $CharacterVelocity,
  CharacterSize as $CharacterSize,
} from "../constants/CharacterAttributesConstants.js";
import { Sprite } from "./Sprite.js";
import Queue from "../framework/Queue.js";
import { ServerMessages } from "../constants/ServerMessages.js";
import $MapManager from "./MapManager.js";
import $CharacterManager from "./CharacterManager.js";
import $MessageManager from "./MessageManager.js";
import { MessageContentsI as $MessageContentsI } from "../game-server/interfaces/ServerInterfaces.js";

interface ClientToServerEvents {
  playerJoinedServer: (data: number) => void;
  basicEmit: (a: number, b: string, c: number[]) => void;
}

interface ServerToClientEvents {
  withAck: (d: string, cb: (e: number) => void) => void;
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
  private clientMovementBuffer: Queue<$Direction> = new Queue();
  private messageHistory: Array<$MessageHeader> = [];

  private grassyfieldConfig: MapConfigI = {
    gameObjects: new Array<$GameObject>(),
    activeCharacters: null,
    name: MapNames.GrassyField,
    mapMinHeight: 0,
    mapMinWidth: 20,
    lowerImageSrc: "/images/maps/Battleground1.png",
    upperImageSrc: "/images/maps/Battleground1.png",
    element: document.querySelector(".game-container"),
    canvas: document
      .querySelector(".game-container")
      .querySelector(".game-canvas"),
    targetFPS: 20,
    targerInterval: 1000 / 20,
    lastFrameTime: 0,
  };

  private hallwayConfig: MapConfigI = {
    gameObjects: new Array<$GameObject>(),
    activeCharacters: null,
    name: MapNames.Hallway,
    mapMinHeight: 0,
    mapMinWidth: 20,
    lowerImageSrc: "/images/maps/Battleground2.png",
    upperImageSrc: "/images/maps/Battleground2.png",
    element: document.querySelector(".game-container"),
    canvas: document
      .querySelector(".game-container")
      .querySelector(".game-canvas"),
    targetFPS: 20,
    targerInterval: 1000 / 20,
    lastFrameTime: 0,
  };

  private MapManger = new $MapManager();
  private MessageManager = new $MessageManager();
  private CharacterManager = new $CharacterManager();

  private OVERWORLD: Overworld_Test = null;

  constructor(networkProxy: NetworkProxy) {
    super();
    this.networkProxy = networkProxy;
    const CharacterCreateRoute = "/player/savecharacter";
    this.init();

    //this.listenForEvent($events.START_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = false; this.OVERWORLD.startGameLoop(); }, this.view);
    //this.listenForEvent($events.STOP_GAME_LOOP, (e) => { this.OVERWORLD.stopLoop = true; }, this.view);

    this.listenForEvent(
      $events.SELECT_CHARACTER,
      (e) => {
        ClientController.ClientControllerInstance.characterSelectionCallback(e);
      },
      this.view
    );

    this.listenForEvent(
      $events.CHARACTER_CREATE,
      async (e) => {
        let result = null;
        console.log("Processing...");
        result = await this.createCharacter(CharacterCreateRoute, e);
        if (result) {
          alert("Character created successfully.");
        } else {
          alert("Failed to create character.");
        }
      },
      this.view
    );

    this.listenForEvent(
      $events.LOGOUT,
      (e) => {
        this.playerLogout();
      },
      this.view
    );

    this.listenForEvent(
      $events.REQUEST_SERVER_ROOMS,
      () => {
        ClientController.ClientControllerInstance.requestActiveServers();
      },
      this.view
    );

    this.listenForEvent(
      $events.SELECT_SERVER,
      (data) => {
        ClientController.ClientControllerInstance.joinServer(data);
      },
      this.view
    );

    this.listenForEvent(
      $events.MESSAGE,
      (message) => {
        this.sendMessage(
          message,
          ClientController.ClientControllerInstance.CharacterManager.Character
            .username
        );
      },
      this.view
    );

    document.addEventListener("visibilitychange", () => {
      console.log("Visibility state:", document.visibilityState);
      if (document.visibilityState === "visible") {
        if (!this.socket || this.socket.disconnected) {
          console.log("Reconnecting socket...");
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
    this.socket.on("connect", () => {
      console.log("Socket connected:" + this.socket.id);
      this.setID(this.socket.id);
      ClientController.ClientControllerInstance.getLatency();
      ClientController.ClientControllerInstance.setCurrentTick().then(() => {
        ClientController.ClientControllerInstance.clientTick();
      });
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }

  async init() {
    // @ts-ignore

    this.connectSocket().then(async () => {
      this.socket.on(
        $socketRoutes.RESPONSE_CLIENT_JOINED_SERVER,
        this.playerJoinedServer
      );
      this.socket.on($socketRoutes.RESPONSE_DISPLAY_LOADING_SCREEN, () =>
        this.view.toggleLoadingScreen()
      );
      this.socket.on($socketRoutes.RESPONSE_ONLINE_CLIENT, (client) => {
        setTimeout(() => {
          this.view.toggleLoadingScreen();
          this.connect(client);
        }, 1000);
      });

      this.socket.on($socketRoutes.RESPONSE_OFFLINE_CLIENT, this.disconnect);
      this.socket.on($socketRoutes.RESPONSE_RECONNECT_CLIENT, () => {
        if (!document.hidden) {
          window.location.reload();
        }
      });

      this.socket.on(
        $socketRoutes.RESPONSE_UPDATED_GAME_OBJECTS,
        (gameObjects, map: MapNames) => {
          this.updateGameObjects(gameObjects, map);
        }
      );

      //proof of concept events
      //this.socket.on('movePlayer', () => { this.updatePlayer });
      //this.socket.on('syncPlayer', (ListOfCharacters) => { this.sendViewCharacterSelection(ListOfCharacters); });
      this.socket.on($socketRoutes.RESPONSE_SYNC_OVERWORLD, (overworld) => {
        this.syncOverworld(overworld);
      });
      //  this.socket.on($socketRoutes.RESPONSE_SYNC_PLAYERS_MOVEMENTS, (charactersMovementData: Array<CharacterMovementData>) => { this.syncPlayersMovements(charactersMovementData) })
      this.socket.on(
        $socketRoutes.RESPONSE_MESSAGE,
        (message: string, username: string) => {
          this.postMessage(message, username);
        }
      );
      this.socket.on(
        $socketRoutes.RESPONSE_SERVER_MESSAGE,
        (message: string) => {
          this.postMessage(message, "Server");
        }
      );
      this.socket.on(
        $socketRoutes.RESPONSE_CLIENT_ACTION_MESSAGE,
        (messages: $MessageHeader) => {
          this.processServerActionMessages(messages);
        }
      );

      this.socket.on(
        $socketRoutes.RESPONSE_ACTIVE_SERVERS,
        (servers: Array<string>) => {
          this.receiveActiveServers(servers);
        }
      );
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
      setTimeout(() => {
        this.getLatency();
      }, 500);
    }
  }

  getID(): string {
    if (this.clientID != "") return this.clientID;
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

    return new Promise((resolve) => {
      resolve(true);
    });
  }

  adjustCurrentTick(adjustmentAmount: number, adjustmentIteration: number) {
    if (adjustmentIteration == this.adjustmentIteration) {
      return;
    }
    this.latency_count += adjustmentAmount;
    this.currentClientTick += adjustmentAmount + this.latency_count;
    this.adjustmentIteration == adjustmentIteration;
    console.log(
      `current client tick: ${this.currentClientTick}, iteration: ${this.adjustmentIteration}`
    );
  }

  public get CurrentSystemTick(): number {
    return this.currentClientTick;
  }

  notifyServer(
    type: ServerMessages,
    _currentDirection: $Direction | undefined,
    _worldWidth: number,
    _worldHeight: number,
    _mapMinWidth: number,
    _mapMinHeight: number,
    tick: number,
    skill?
  ) {
    let messageCount = 1;
    if (!_currentDirection) {
      _currentDirection = $Direction.STANDSTILL;
    }

    let messageHeader: $MessageHeader = null;

    switch (type) {
      case ServerMessages.Skill:
        let skillParameters: $MessageContentsI = {
          action: skill,
          worldWidth: _worldWidth,
          worldHeight: _worldHeight,
          mapMinWidth: _mapMinWidth,
          mapMinHeight: _mapMinHeight,
        };

        messageHeader = this.createMessage(
          skillParameters,
          type,
          this.adjustmentIteration,
          messageCount,
          tick,
          this.getID()
        );
        break;

      case ServerMessages.Movement:
        let movementParameters: $MessageContentsI = {
          action: _currentDirection,
          worldWidth: _worldWidth,
          worldHeight: _worldHeight,
          mapMinWidth: _mapMinWidth,
          mapMinHeight: _mapMinHeight,
        };
        messageHeader = this.createMessage(
          movementParameters,
          type,
          this.adjustmentIteration,
          messageCount,
          tick,
          this.getID()
        );
        break;
    }

    if (!messageHeader) {
      console.log("Failed to create message.");
      return;
    }

    console.log(
      "message being sent: ",
      messageHeader.contents.at(0),
      " ",
      messageHeader.contents.at(0).action
    );
    this.socket.emit(
      $socketRoutes.REQUEST_CLIENT_ACTION_MESSAGE,
      messageHeader
    );

    //throw new Error("Method not implemented.");
  }

  createMessage(
    action: any,
    type: ServerMessages,
    adjustmentIteration: number,
    messageCount: number,
    tick: number,
    id: string
  ) {
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

      this.currentClientTick++;
    }, this.clientTickRate);
  }

  /**
   * Receives a message header from the server
   * Adds the message to the message history
   * Checks iteration number and then process any tick updates.
   * Confirms if the interpolated positions are accurate and updates their status to true if they match the server values.
   * If interpolated positions are incorrect then it performs the corrections.
   */

  processServerActionMessages(data: any) {
    let serverMessageHeader =
      ClientController.ClientControllerInstance.createMessageHeaderAndMessagesFromData(
        data
      );
    let messages: $Message[];
    if (!(serverMessageHeader instanceof $MessageHeader)) {
      console.log("No message header found.", serverMessageHeader);
      return;
    }

    this.messageHistory.push(serverMessageHeader);

    if (serverMessageHeader.adjustmentIteration != this.adjustmentIteration) {
      this.adjustCurrentTick(
        serverMessageHeader.tickAdjustment,
        serverMessageHeader.adjustmentIteration
      );
    }

    messages = serverMessageHeader.contents;
    messages.forEach((message: $Message) => {
      if (!(message instanceof $Message)) {
        console.log("Message is not the correct typing.", message);
        return;
      }

      let { username } = message.action;
      /**
       * Checks to message sent by server
       * Checks to see if the message references the current clients character
       * If message is of type movement than the system checks to see if it correctly inerpolated the clients position.
       * If it did not than the system will correct the movement.
       * If the message is not about the current clients character the system will move that character on the clients sceen and play the appropriate animation.
       **/
      if (message.type == ServerMessages.Movement) {
        if (
          username ==
          ClientController.ClientControllerInstance.CharacterManager.Character
            .name
        ) {
          let predictedPositions =
            ClientController.ClientControllerInstance.checkInterpolatedPositions(
              message
            );
          if (!predictedPositions) {
            ClientController.clientController.fixIncorrectPredections(message);
          }
          console.log(
            `Predicted position result for tick: ${message.tick} : ${predictedPositions}.`
          );
        } else {
          ClientController.ClientControllerInstance.MapManger.moveNonControlledCharactersWithAnimations(
            message.action
          );
        }
      }

      if (message.type == ServerMessages.Skill) {
      }
    });
  }

  setInputHistory(position: { x: number; y: number }, tick: number) {
    let predictedPosition: $inputHistory = {
      location: {
        x: position.x,
        y: position.y,
      },
      tick: tick,
      confirmedPosition: false,
    };
    ClientController.ClientControllerInstance.CharacterManager.InputHistory.set(
      tick,
      predictedPosition
    );
  }

  /**
   *
   * @param data Object received from the server containg the necessary info to create a messageheader and messages.
   *
   */
  createMessageHeaderAndMessagesFromData(data: any): $MessageHeader | null {
    let messageArray: $Message[] = [];
    if (data.contents && Array.isArray(data.contents)) {
      console.log("Converting object into Message.");
      for (let message of data.contents) {
        messageArray.push(
          new $Message(message.type, message.action, message.tick, message.id)
        );
      }
    } else {
      console.log("Unable to convert object into Message.");
      return null;
    }
    let messageHeader: $MessageHeader = new $MessageHeader(
      data.adjustmentIteration,
      messageArray,
      data.id,
      data.tickAdjustment
    );
    return messageHeader;
  }

  /**
   * Check the message array to make sure its the correct typing.
   * Check the messages in the array
   */

  checkInterpolatedPositions(serverMessage: $Message): boolean {
    console.log("Check interpolated positions.");
    if (!(serverMessage instanceof $Message)) {
      console.log("Message is not the correct type. " + typeof serverMessage);
      return false;
    }

    if (
      !ClientController.ClientControllerInstance.CharacterManager.InputHistory.has(
        serverMessage.tick
      )
    ) {
      console.log("Tick was not found in input history.");

      let x = serverMessage.action.coords.x;
      let y = serverMessage.action.coords.y;
      let tick = serverMessage.tick;

      let input = {
        location: { x, y },
        tick: tick,
        confirmedPosition: true,
      };

      ClientController.ClientControllerInstance.CharacterManager.InputHistory.set(
        serverMessage.tick,
        input
      );
      console.log("Tick was added to input history.");
      return true;
    }

    let inputHistory: $inputHistory;
    inputHistory =
      ClientController.ClientControllerInstance.CharacterManager.InputHistory.get(
        serverMessage.tick
      );

    let { coords } = serverMessage.action;

    if (
      coords.x == inputHistory.location.x &&
      coords.y == inputHistory.location.y
    ) {
      inputHistory.confirmedPosition = true;
      return true;
    }
    return false;
  }

  fixIncorrectPredections(message: $Message) {
    console.log("Fixing incorrect predicted position.");

    let inputHistory: $inputHistory;
    inputHistory =
      ClientController.ClientControllerInstance.CharacterManager.InputHistory.get(
        message.tick
      );

    let x = message.action.coords.x;
    let y = message.action.coords.y;
    let pos = { x, y };

    console.log(
      `Prediction: x:${inputHistory.location.x} | y:${inputHistory.location.y} : Actual: x:${x} | y:${y}.`
    );

    inputHistory.location = pos;
    inputHistory.confirmedPosition = true;
    ClientController.ClientControllerInstance.CharacterManager.Character.x = x;
    ClientController.ClientControllerInstance.CharacterManager.Character.y = y;
    ClientController.ClientControllerInstance.MapManger.updateCharacterPositionViaServerREQ(
      ClientController.ClientControllerInstance.CharacterManager.Character,
      x,
      y
    );
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
    this.CharacterManager.setListOfCharacter(
      clientController.client.characters
    );
    clientController.sendViewCharacterSelection(
      this.CharacterManager.getListOfCharacters()
    );

    //TODO call startOverworldOnConnection with character.location
    clientController.startOverworldOnConnection();
  }

  sendViewCharacterSelection(ListOfCharacters: Array<any>) {
    let clientController = ClientController.ClientControllerInstance;
    clientController.view.createCharacterSelectionButtons(ListOfCharacters);
  }

  characterSelectionCallback(data) {
    let clientController = ClientController.ClientControllerInstance;
    let characterPosition: number = data.detail;

    let char =
      clientController.CharacterManager.selectCharacterByIndex(
        characterPosition
      );
    let characterOBJ =
      clientController.CharacterManager.syncUsertoCharacter(char);
    console.log(
      `User: ${clientController.client.username} is playing on ${clientController.CharacterManager.Character.username}`
    );
    console.log("Selected-character being sent to the server: ", characterOBJ);
    clientController.socket.emit(
      $socketRoutes.REQUEST_ADD_CREATED_CHARACTER,
      characterOBJ,
      characterOBJ.location,
      clientController.clientID
    );

    if (clientController.CharacterManager.Character.location == null) {
      clientController.CharacterManager.Character.location =
        MapNames.GrassyField;
    }

    if (
      clientController.CharacterManager.Character.unlockedSkills.length == 0
    ) {
      clientController.CharacterManager.addCharacterBasicSkills();
      clientController.CharacterManager.addBasicSkillsToHotBar();
      console.log(
        "Client controller: ",
        clientController.CharacterManager.Character
      );
      clientController.socket.emit(
        $socketRoutes.REQUEST_CHARACTER_UPDATE,
        this.clientID,
        clientController.CharacterManager.Character
      );
      //ANCHOR - Save character hotbar
    }

    clientController.MapManger.setClientsCharacterOnMap(
      clientController.CharacterManager.Character,
      clientController.CharacterManager.Character.location
    );

    clientController.MapManger.addCharacterToOverworld(
      clientController.CharacterManager.Character,
      clientController.CharacterManager.Character.location
    );
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
    /* if (clientController.OVERWORLD == null) {
            clientController.createOverworld();
        } */
    clientController.socket.emit("requestOverworldGameObjects", startMap);
    console.log("Starting new Oveworld map: " + startMap);
    clientController.MapManger.startOverWorld(startMap);
  }

  updateGameObjects(gameObjects: $GameObject[], updatedMap: MapNames) {
    let clientController = ClientController.ClientControllerInstance;

    clientController.MapManger.updateGameObjects(gameObjects, updatedMap);
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
    clientController.socket.emit(
      $socketRoutes.REQUEST_JOIN_SERVER_ROOM,
      clientController.clientID,
      serverRoom.detail
    );
  }

  changeGameMap(map: MapNames) {
    let clientController = ClientController.ClientControllerInstance;
    clientController.MapManger.changeGameMap(map);
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

  syncOverworld(overworld: $syncOverworldTransmit) {
    let clientController = ClientController.ClientControllerInstance;
    let convertedOverWorld: any = Object.assign({}, overworld);
    convertedOverWorld.grassyfield.activePlayers = utilFunctions.objectToMap(
      overworld.grassyfield.activePlayers
    );
    convertedOverWorld.hallway.activePlayers = utilFunctions.objectToMap(
      overworld.hallway.activePlayers
    );
    clientController.MapManger.syncOverworld(
      convertedOverWorld as $syncOverworld,
      clientController.CharacterManager
    );
  }

  findRecentlyAddedCharacters(
    currentPlayers: Map<string, $characterDataInterface>,
    newPlayers: Map<string, $characterDataInterface>
  ): Array<$characterDataInterface> {
    let newPlayersList = new Array<$characterDataInterface>();
    console.log("newPlayers: ", newPlayers, " Type: ", typeof newPlayers);

    if (typeof newPlayers === "object" && !(newPlayers instanceof Map)) {
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

  createCharacterFromCharacterDataI(
    character: $characterDataInterface
  ): Character {
    /*  if (character.y >= 400) {
             character.y = 100;
         }
        */
    let createdCharacter =
      ClientController.ClientControllerInstance.CharacterManager.createCharacterFromCharacterDataI(
        character
      );
    return createdCharacter;
  }

  addCharacterToOverworld(
    character: $Character,
    map: MapNames = MapNames.GrassyField
  ) {
    ClientController.ClientControllerInstance.MapManger.addCharacterToOverworld(
      character,
      map
    );
  }

  private findOverWorldMapByName(searchingMap: MapNames): GameMap | null {
    return ClientController.ClientControllerInstance.MapManger.findOverworldMapByName(
      searchingMap
    );
  }

  //create an interface for obj
  syncUsertoCharacter(obj) {
    let char =
      ClientController.ClientControllerInstance.CharacterManager.syncUsertoCharacter(
        obj
      );
    return char;
  }

  emit(event: string, data: any = false) {
    if (data)
      ClientController.ClientControllerInstance.socket.emit(event, data);
    ClientController.ClientControllerInstance.socket.emit(event);
    console.log("emitting event: ", event);
  }

  checkMessage(message: string) {
    return ClientController.ClientControllerInstance.MessageManager.checkMessage(
      message
    );
  }

  sendMessage(message: any, user: string) {
    if (ClientController.ClientControllerInstance.activeServer) {
      ClientController.ClientControllerInstance.MessageManager.sendMessage(
        message.detail,
        user,
        this.socket,
        ClientController.ClientControllerInstance.activeServer
      );
      return;
    }

    alert("Select a server to send a message.");
  }

  postMessage(message: string, username: string) {
    let cleanMessage =
      ClientController.clientController.MessageManager.checkMessage(
        message,
        ""
      );
    ClientController.ClientControllerInstance.view.postMessage(
      cleanMessage,
      username
    );
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
      };

      console.log(data.detail);
      characterData = Object.assign(characterData, data.detail);
      let response = await this.networkProxy.postJSON(route, characterData);

      if (response && response.ok) {
        this.view.resetSignupForm();
        // Promise.resolve(true);
        return new Promise((resolve) => {
          resolve(true);
        });
      } else {
        console.log(
          "Something went wrong writing character, status: ",
          response?.status
        );
        return Promise.reject(false);
      }
    } catch (e) {
      console.log("Something went wrong writing character", e);
      return Promise.reject(false);
    }
  }

  //TODO
  disconnect(client: Object) {
    console.log("disconnected client", client);
    let result = utilFunctions.checkIfObjectMeetsCharacterDataInterface(client);
    if (result) {
      console.log(`User: ${(client as Character).username} is offline.`);
      ClientController.ClientControllerInstance.MapManger.removeCharacterFromMap(
        client
      );
    }
  }

  playerJoinedServer(data) {
    console.log(
      `You successfully joined server: ${data.serverRoom}, your ID: ${data.id} `
    );
  }

  //TODO
  async playerLogout() {
    this.socket.emit(
      $socketRoutes.REQUEST_CLIENT_LOGOUT,
      ClientController.ClientControllerInstance.socket.id
    );
    let response = await this.networkProxy.postJSON("/player/logout", null);
    if (response.ok) {
      console.log("Logged out");
      window.location.reload();
    } else {
      console.log("error");
    }
  }
}
ClientController.ClientControllerInstance;
