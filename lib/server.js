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
import { ClientMapSlot } from "./src/game-server/GameRouter.js";
import connectDB from "./src/db/db-init.js";
import playerRouter from "./src/game-server/routes/PlayerRouter.js";
import { SocketConstants as $SocketConstants } from "./src/constants/ServerConstants.js";
import { GameRouter as $gameRouter } from "./src/game-server/GameRouter.js";
import { Skill as $skill } from "./src/app/Skill.js";
import fsModule from "fs";
import { COOKIE_SECRET, MONGO_URI } from "./src/authentication/secrets.js";
import { ClientObject as $ClientObject } from "./src/game-server/ClientObject.js";
const fs = fsModule.promises;
(function start_server() {
    const app = express.default();
    connectDB();
    app.use(express.static("static"));
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
    app.use(session);
    app.use(passport.initialize());
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
    app.engine("hbs", exhbs({
        defaultLayout: "index",
        extname: ".hbs",
    }));
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
                console.log("player disconnected: id:", clientSocket.id, " ip:", clientSocket.handshake.address);
            }
        });
        clientSocket.on("connect_error", (err) => {
            console.log("sockets connection error " + err.message);
        });
        console.log("connecting client: " + clientSocket.handshake.address);
        if (gameRouter.getClient(clientSocket.handshake.address)) {
            if (!gameRouter.getClientMap().has(clientSocket.id)) {
                let mapArr = new $ClientObject();
                console.log("new Client Added: ", clientSocket.handshake.address);
                gameRouter.getClientMap().set(clientSocket.id, mapArr);
            }
            const CLIENT = gameRouter.getClientMap().get(clientSocket.id);
            if (!CLIENT.getClientSocket()) {
                let clientSocketOBJ = {
                    id: clientSocket.id,
                    arg: clientSocket,
                };
                console.log("Client socket set", clientSocket.id);
                gameRouter.setClientMap(clientSocketOBJ, ClientMapSlot.ClientSocket);
            }
            if (!CLIENT.getClientOBJ()) {
                let clientOBJ = {
                    id: clientSocket.id,
                    arg: gameRouter.getClient(clientSocket.handshake.address),
                };
                gameRouter.setClientMap(clientOBJ, ClientMapSlot.ClientOBJ);
                if (gameRouter.getClientMap().has(clientSocket.id)) {
                    if (CLIENT.isSkillTreeEmpty()) {
                        fs.readFile("./src/constants/skills.json", "utf8")
                            .then((data) => {
                            const jsonData = JSON.parse(data);
                            jsonData.forEach((skill) => {
                                if (skill.dependencies.class == null) {
                                    let createdSkill = new $skill(skill);
                                    CLIENT.setUsableSkill(createdSkill);
                                }
                            });
                            let skillsTree = {
                                id: clientSocket.id,
                                arg: jsonData,
                            };
                            gameRouter.setClientMap(skillsTree, ClientMapSlot.ClientSkillTree);
                        })
                            .catch((err) => {
                            console.log("Error: ", err);
                        });
                    }
                }
            }
            console.log("server sent client info: " +
                clientSocket.emit($SocketConstants.RESPONSE_ONLINE_CLIENT, gameRouter.getClientMap().get(clientSocket.id)?.getClientOBJ()));
            gameRouter.initGame(clientSocket, clientSocket.handshake.address);
        }
        else {
            clientSocket.emit($SocketConstants.RESPONSE_RECONNECT_CLIENT);
        }
    });
    server.on("error", (err) => {
        console.error(err);
    });
})();
function registerStaticPaths(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use("/src/app", express.static(path.join(__dirname, "./src/app")));
    app.use("/src/socketIO", express.static(path.join(__dirname, "./src/socketIO")));
    app.use("/src/constants", express.static(path.join(__dirname, "./src/constants")));
    app.use("/src/game-server", express.static(path.join(__dirname, "./src/game-server")));
    app.use("/src/html", express.static(path.join(__dirname, "./src/html")));
    app.use("/src/", express.static(path.join(__dirname, "./src/")));
    app.use("/src/framework", express.static(path.join(__dirname, "./src/framework")));
    app.use("/src/network", express.static(path.join(__dirname, "./src/network")));
    app.use("/favicon", express.static(path.join(__dirname, "./favicon/")));
    app.use("/css", express.static(path.join(__dirname, "./css/")));
    app.use("/images", express.static(path.join(__dirname, "./images/")));
    app.use("/", express.static(path.join(__dirname, "/")));
    app.use("/src/constants", express.static(path.join(__dirname, "./src/constants")));
    app.use("/test", express.static(path.join(__dirname, "./test/")));
}
function configureRoutes(app, server, io, PORT) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.get("/", (req, res, next) => {
        if (req.isAuthenticated()) {
            res.redirect("/main");
        }
        else {
            res.render("signup", { layout: "landing" });
        }
    });
    app.get("/main", (req, res) => {
        if (req.isAuthenticated()) {
            async function requestUserInfo() {
                try {
                    let clientOBJ = await req.user.populate("characters");
                    console.log("IP: " + req.ip + "\n player: " + req.user + "\n");
                    $gameRouter.GameRouterInstance.setClientIP(req.ip);
                    $gameRouter.GameRouterInstance.setClient(clientOBJ, req.ip);
                    res.render("index", { layout: "index" });
                }
                catch (error) {
                    console.log(error);
                    res.status(500).send("Internal Server Error.");
                }
            }
            requestUserInfo();
        }
        else {
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
//# sourceMappingURL=server.js.map