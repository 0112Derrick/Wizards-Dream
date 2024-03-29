import cluster from "cluster";
import os from "os";
import connectMongo from "connect-mongo";
import { LANDING_HTML_IDS, HTML_IDS } from "./src/constants/HTMLElementIds.js";
import * as express from "express";
import expressSession from "express-session";
import exhbs from "express-handlebars";
import passport from "passport";
import initLocalStrategy from "./src/authentication/passport-strategies.js";
import path from "path";
import { fileURLToPath } from "url";
import * as socketio from "socket.io";
import * as http from "http";
import { ClientMapSlot, GameRouter } from "./src/game-server/GameRouter.js";

//import exp from 'constants';
import { nextTick } from "process";
import { Document } from "mongodb";
import { mongo } from "mongoose";
import { IPlayerDoc } from "./src/game-server/PlayerDBModel.js";
import { Player } from "./src/game-server/Player.js";
import connectDB from "./src/db/db-init.js";
import playerRouter from "./src/game-server/routes/PlayerRouter.js";
import runDBTest from "./src/db-test.js";
import { SocketConstants as $SocketConstants } from "./src/constants/ServerConstants.js";
import { GameRouter as $gameRouter } from "./src/game-server/GameRouter.js";
import { Skill as $skill } from "./src/app/Skill.js";

//import { createGameState } from './src/app/game.js';

import fsModule from "fs";
import { COOKIE_SECRET, MONGO_URI } from "./src/authentication/secrets.js";
import Queue from "./src/framework/Queue.js";
import { Direction } from "./src/app/DirectionInput.js";
import { ClientObject as $ClientObject } from "./src/game-server/ClientObject.js";
//import * as SkillsData from "./src/constants/skills.json" assert {type: 'json'};
//import * as fs from 'fs';

//import { a, b } from './testDB.js';

declare global {
  namespace Express {
    interface Request {
      player?: Player;
    }

    interface User {
      id: String;
      username: String;
      characters: Array<any>;
      email: String;
      save();
      validPassword();
    }
  }
}

interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const fs = fsModule.promises;

(function start_server() {
  const app = express.default();

  connectDB();

  app.use(express.static("static"));

  // Setup session MW
  const session = expressSession({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connectMongo.create({
      mongoUrl: MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 60000 * 1440,
    },
  });

  // express session({..}) initialization
  app.use(session);

  //init passport on every route call
  app.use(passport.initialize());

  // allow passport to use 'express-session'
  app.use(passport.session());

  app.set("trust proxy", true);

  initLocalStrategy(passport);

  registerStaticPaths(app);

  app.use((req, res, next) => {
    res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
    res.locals.HTML_IDS = HTML_IDS;

    next();
  });

  configureRoutes(app);

  // runDBTest();

  app.engine(
    "hbs",
    exhbs({
      defaultLayout: "index",
      extname: ".hbs",
    })
  );

  app.set("views", "./render-templates");
  app.set("view engine", ".hbs");

  const PORT = process.env.Port ?? 8080;

  const server = http.createServer(app);

  const io = new socketio.Server(server);

  console.log("Server listening on port: " + PORT);

  server.listen(PORT);

  let gameRouter = $gameRouter.GameRouterInstance;
  gameRouter.setIO(io);

  let activeSockets;

  io.on("connection", (clientSocket) => {
    clientSocket.emit($SocketConstants.RESPONSE_DISPLAY_LOADING_SCREEN);

    activeSockets = io.sockets.sockets.entries();
    for (let [socketId, connectedSocket] of activeSockets) {
      console.log(`Socket ID: ${socketId} is connected.`);
      gameRouter.addToActiveSockets(socketId);
    }

    clientSocket.on("disconnect", () => {
      let foundSocket = false;

      for (const [socketId, connectedSocket] of activeSockets) {
        if (clientSocket.id == socketId) {
          foundSocket = true;
          gameRouter.deleteFromActiveSocket(socketId);
        }
      }

      if (foundSocket) {
        let client = gameRouter
          .getClientMap()
          .get(clientSocket.id)
          .getActiveCharacter();
        io.emit($SocketConstants.RESPONSE_OFFLINE_CLIENT, client);
        gameRouter.handlePlayerDisconnection(clientSocket, clientSocket.id);
        console.log(
          "player disconnected: id:",
          clientSocket.id,
          " ip:",
          clientSocket.handshake.address
        );
      }
    });

    clientSocket.on("connect_error", (err) => {
      console.log("sockets connection error " + err.message);
    });

    console.log("connecting client: " + clientSocket.handshake.address);

    //set by express via req obj temporarily until the data is saved in the ClientMap
    if (gameRouter.getClient(clientSocket.handshake.address)) {
      /*
       * Check to see if client exist in our client map
       * If client does not exist in client map then add them to the map
       */

      if (!gameRouter.getClientMap().has(clientSocket.id)) {
        let mapArr: $ClientObject = new $ClientObject();
        console.log("new Client Added: ", clientSocket.handshake.address);
        gameRouter.getClientMap().set(clientSocket.id, mapArr);
      }

      const CLIENT = gameRouter.getClientMap().get(clientSocket.id);
      /*
       * Check to see if client socket data is set in our map
       * If client socket data does not exist in client map then add the data to the map
       */

      if (!CLIENT.getClientSocket()) {
        let clientSocketOBJ = {
          id: clientSocket.id,
          arg: clientSocket,
        };

        console.log("Client socket set", clientSocket.id);
        gameRouter.setClientMap(clientSocketOBJ, ClientMapSlot.ClientSocket);
      }

      /*
       * Check to see if client Obj (character data) is set in our map
       * If client Obj does not exist in client map then add the data to the map
       */
      // if (!gameRouter.getClientMap().get(clientSocket.handshake.address).at(ClientMapSlot.ClientOBJ)) {
      if (!CLIENT.getClientOBJ()) {
        let clientOBJ = {
          id: clientSocket.id,
          //client obj is set through express then saved in a map in gameRouter obj
          //this checks to see if that information is set and then adds it to our client map
          arg: gameRouter.getClient(clientSocket.handshake.address),
        };

        gameRouter.setClientMap(clientOBJ, ClientMapSlot.ClientOBJ);

        if (gameRouter.getClientMap().has(clientSocket.id)) {
          if (CLIENT.isSkillTreeEmpty()) {
            fs.readFile("./src/constants/skills.json", "utf8")
              .then((data) => {
                const jsonData = JSON.parse(data);

                jsonData.forEach((skill) => {
                  // console.log("skill: ", skill, "\n");
                  
                  if (skill.dependencies.class == null) {
                    let createdSkill = new $skill(skill);
                    CLIENT.setUsableSkill(createdSkill);
                  }
                });

                let skillsTree = {
                  id: clientSocket.id,
                  arg: jsonData,
                };

                gameRouter.setClientMap(
                  skillsTree,
                  ClientMapSlot.ClientSkillTree
                );
              })
              .catch((err) => {
                console.log("Error: ", err);
              });
          }
        }
      }

      console.log(
        "server sent client info: " +
          clientSocket.emit(
            $SocketConstants.RESPONSE_ONLINE_CLIENT,
            gameRouter.getClientMap().get(clientSocket.id)?.getClientOBJ()
          )
      );
      // gameRouter.setIO(io);
      gameRouter.initGame(clientSocket, clientSocket.handshake.address);
    } else {
      clientSocket.emit($SocketConstants.RESPONSE_RECONNECT_CLIENT);
    }
    // console.log(gameRouter.client.characters.at(0).username);
    //client.emit('message', 'You are connected');
    //client.on('message', (text) => { io.emit('message', text) });
  });

  server.on("error", (err) => {
    console.error(err);
  });
})();

function registerStaticPaths(app) {
  // Set __dirname
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  //Register static paths for loading modules
  app.use("/src/app", express.static(path.join(__dirname, "./src/app")));
  app.use(
    "/src/socketIO",
    express.static(path.join(__dirname, "./src/socketIO"))
  );
  app.use(
    "/src/constants",
    express.static(path.join(__dirname, "./src/constants"))
  );
  app.use(
    "/src/game-server",
    express.static(path.join(__dirname, "./src/game-server"))
  );
  app.use("/src/html", express.static(path.join(__dirname, "./src/html")));
  app.use("/src/", express.static(path.join(__dirname, "./src/")));
  app.use(
    "/src/framework",
    express.static(path.join(__dirname, "./src/framework"))
  );
  app.use(
    "/src/network",
    express.static(path.join(__dirname, "./src/network"))
  );
  app.use("/favicon", express.static(path.join(__dirname, "./favicon/")));
  app.use("/css", express.static(path.join(__dirname, "./css/")));
  app.use("/images", express.static(path.join(__dirname, "./images/")));
  app.use("/", express.static(path.join(__dirname, "/")));
  app.use(
    "/src/constants",
    express.static(path.join(__dirname, "./src/constants"))
  );
  app.use("/test", express.static(path.join(__dirname, "./test/")));
}

function configureRoutes(app, server?, io?, PORT?) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  app.get("/", (req, res, next) => {
    /* for (let i = 0; i < 1e8; i++) {

        } */

    if (req.isAuthenticated()) {
      //Already logged in, so display main app
      res.redirect("/main");
    } else {
      res.render("signup", { layout: "landing" });
    }
  });

  app.get("/main", (req, res) => {
    if (req.isAuthenticated()) {
      /**
       * @param description Loads the main page of WD and attaches the user's characters to the user object received from DB
       *  Captures the user's IP address so that way we can verify the user later to set their client socket during game initilization
       *  @param data none
       * @param event When user refreshes the page
       * */

      async function requestUserInfo() {
        try {
          let clientOBJ = await req.user.populate("characters");

          // clientOBJ.characters.forEach((char) => {
          //   console.log(char);
          //   if (char["characterID"] || !char.gameObjectID) {
          //     const randomNum = Math.floor(Math.random() * 1000);
          //     char.gameObjectID =
          //       char["characterID"] | (Date.now() + randomNum);
          //     try {
          //       char.save();
          //     } catch (error) {
          //       console.log(error);
          //     }
          //   }
          // });

          console.log("IP: " + req.ip + "\n player: " + req.user + "\n");

          $gameRouter.GameRouterInstance.setClientIP(req.ip);
          $gameRouter.GameRouterInstance.setClient(clientOBJ, req.ip);

          res.render("index", { layout: "index" });
        } catch (error) {
          console.log(error);
          res.status(500).send("Internal Server Error.");
        }
      }
      requestUserInfo();
    } else {
      res.redirect("/");
    }
  });

  app.get("/signup", (req, res) => {
    res.render("signup", { layout: "landing" });
  });

  app.get("/character", (req, res) => {
    res.render("index");
  });

  app.use("/player", playerRouter);
}
