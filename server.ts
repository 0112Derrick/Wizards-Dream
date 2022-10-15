

import connectMongo from 'connect-mongo';
import { LANDING_HTML_IDS, HTML_IDS } from './src/constants/HTMLElementIds.js';
import * as express from 'express';
import expressSession from 'express-session';
import exhbs from 'express-handlebars';
import passport from 'passport'
import initLocalStrategy from './src/authentication/passport-strategies.js'
import path from 'path';
import { fileURLToPath } from 'url';
import * as socketio from 'socket.io';
import * as http from 'http';
import { ClientMapSlot, GameRouter } from './src/players/GameRouter.js';
import { TestPlayer } from './src/players/GameRouter.js';

import exp from 'constants';
import { nextTick } from 'process';
import { Document } from 'mongodb';
import { mongo } from 'mongoose';
import { IPlayerDoc } from './src/players/PlayerDBModel.js';
import { Player } from './src/players/Player.js';
import connectDB from './src/db/db-init.js';
import playerRouter from './src/players/routes/PlayerRouter.js';
import runDBTest from './src/db-test.js';
import { GameRouter as $gameRouter } from './src/players/GameRouter.js';
import authorRouter from './testDB.js'

//import { createGameState } from './src/app/game.js';

import fsModule from 'fs';
import { COOKIE_SECRET, MONGO_URI } from './src/authentication/secrets.js';

import { a, b } from './testDB.js';

declare global {
    namespace Express {
        interface Request {
            player?: Player,

        }
        interface User {
            id: String,
            username: String,
            characters: Array<any>,
            email: String
            save()
            validPassword()
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

    app.use(express.static('static'));


    // Setup session MW
    const session = expressSession({
        secret: COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        store: connectMongo.create({
            mongoUrl: MONGO_URI,
            collectionName: 'sessions',
        }),
        cookie: {
            maxAge: 60000 * 1440
        }
    });

    // express session({..}) initialization
    app.use(session);

    //init passport on every route call
    app.use(passport.initialize());

    // allow passport to use 'express-session'
    app.use(passport.session());

    app.set('trust proxy', true);

    initLocalStrategy(passport);

    registerStaticPaths(app);

    app.use((req, res, next) => {
        res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
        res.locals.HTML_IDS = HTML_IDS;

        next();
    });

    configureRoutes(app);

    // runDBTest();


    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }));

    app.set('views', './render-templates');
    app.set("view engine", ".hbs");

    const server = http.createServer(app);

    const io = new socketio.Server(server);

    let gameRouter = $gameRouter.GameRouterInstance;
    gameRouter.setIO(io);

    let id = 0;

    io.on('connection', clientSocket => {
        console.log("connecting client: " + clientSocket.handshake.address);

        //set by express via req obj temporarily until the data is saved in the ClientMap 
        if (gameRouter.getClient(clientSocket.handshake.address)) {

            /*
            * Check to see if client exist in our client map
            * If client does not exist in client map then add them to the map
            */

            if (!gameRouter.getClientMap().has(clientSocket.handshake.address)) {
                let mapArr: Array<any> = [];
                console.log('new Client Added: ', clientSocket.handshake.address);
                gameRouter.getClientMap().set(clientSocket.handshake.address, mapArr);
            }

            /*
            * Check to see if client socket data is set in our map
            * If client socket data does not exist in client map then add the data to the map
            */
            if (!gameRouter.getClientMap().get(clientSocket.handshake.address).at(ClientMapSlot.ClientSocket)) {
                let clientSocketOBJ = {
                    id: clientSocket.handshake.address,
                    arg: clientSocket
                }
                console.log("Client socket set", clientSocket.handshake.address)
                gameRouter.setClientMap(clientSocketOBJ, ClientMapSlot.ClientSocket);
            }

            /*
            * Check to see if client Obj (character data) is set in our map
            * If client Obj does not exist in client map then add the data to the map
            */
            if (!gameRouter.getClientMap().get(clientSocket.handshake.address).at(ClientMapSlot.ClientOBJ)) {

                let clientOBJ = {
                    id: clientSocket.handshake.address,
                    arg: gameRouter.getClient(clientSocket.handshake.address)
                }

                gameRouter.setClientMap(clientOBJ, ClientMapSlot.ClientOBJ);
            }
        }
        clientSocket.emit('clientID', clientSocket.handshake.address);

        // let player = new TestPlayer(id);
        // id++;

        //gameRouter.testInitGame(clientSocket, clientSocket.handshake.address, player);

        console.log("server sent client info: " + clientSocket.emit("onlineClient", gameRouter.getClientMap().get(clientSocket.handshake.address)?.at(ClientMapSlot.ClientOBJ)));
        gameRouter.initGame(clientSocket, clientSocket.handshake.address,);



        // console.log(gameRouter.client.characters.at(0).username)



        // console.log('server ', client.handshake.headers.host);

        //client.emit('message', 'You are connected');
        //client.on('message', (text) => { io.emit('message', text) });

    });

    io.on('disconnect', client => {
        gameRouter.playerDisconnect(client.handshake.headers.host);
    })

    server.on('error', (err) => {
        console.error(err);
    });

    const PORT = process.env.Port ?? 8080;
    console.log("Server listening on port: " + PORT);
    server.listen(PORT);
})();


function registerStaticPaths(app) {
    // Set __dirname
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    //Register static paths for loading modules
    app.use('/src/app', express.static(path.join(__dirname, './src/app')));
    app.use('/src/socketIO', express.static(path.join(__dirname, './src/socketIO')));
    app.use('/src/constants', express.static(path.join(__dirname, './src/constants')));
    app.use('/src/players', express.static(path.join(__dirname, './src/players')));
    app.use('/src/html', express.static(path.join(__dirname, './src/html')));
    app.use('/src/', express.static(path.join(__dirname, './src/')));
    app.use('/src/framework', express.static(path.join(__dirname, './src/framework')));
    app.use('/src/network', express.static(path.join(__dirname, './src/network')));
    app.use('/favicon', express.static(path.join(__dirname, './favicon/')));
    app.use('/css', express.static(path.join(__dirname, './css/')));
    app.use('/images', express.static(path.join(__dirname, './images/')));
    app.use('/', express.static(path.join(__dirname, '/')));
    app.use('/src/constants', express.static(path.join(__dirname, './src/constants')));

}

function configureRoutes(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    app.get("/", (req, res, next) => {

        if (req.isAuthenticated()) {
            //Already logged in, so display main app
            //console.log('player: ' + req.user);

            async function requestUserInfo() {
                let clientOBJ = await req.user.populate('characters');
                console.log("IP: " + req.ip + "\n player: " + req.user + "\n");
                $gameRouter.GameRouterInstance.setClientIP(req.ip);
                $gameRouter.GameRouterInstance.setClient(clientOBJ, req.ip);
            }

            requestUserInfo();
            res.redirect("/main");
        } else {
            res.render("signup", { layout: 'landing' });
        }
    });


    app.get('/main', (req, res) => {

        if (req.isAuthenticated()) {

            /**
             * @param description Loads the main page of WD and attaches the user's characters to the user object received from DB
             *  Captures the user's IP address so that way we can verify the user later to set their client socket during game initilization
             *  @param data none
             * @param event When user refreshes the page             
             * */
            async function requestUserInfo() {
                let clientOBJ = await req.user.populate('characters');
                console.log("IP: " + req.ip + "\n player: " + req.user + "\n");
                $gameRouter.GameRouterInstance.setClientIP(req.ip);
                $gameRouter.GameRouterInstance.setClient(clientOBJ, req.ip);
            }
            requestUserInfo();
            res.render('index', { layout: 'index' });
        }
        else {
            res.redirect('/');
        }
    });

    app.get('/signup', (req, res) => {
        res.render('signup', { layout: 'landing' });
    });

    app.get("/character", (req, res) => {
        res.render("index");
    });

    app.use('/player', playerRouter);
}

