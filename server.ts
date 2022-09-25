

import connectMongo from 'connect-mongo';
<<<<<<< HEAD
//import { LANDING_HTML_IDS, HTML_IDS } from './src/constants/HTMLElementIds.js';
import expressSession from 'express-session';
import exhbs, { ExpressHandlebars } from 'express-handlebars';
=======
import { LANDING_HTML_IDS, HTML_IDS } from './src/constants/HTMLElementIds.js';
import * as express from 'express';
import expressSession from 'express-session';
import exhbs from 'express-handlebars';
>>>>>>> multiplayer
import passport from 'passport'
import initLocalStrategy from './src/authentication/passport-strategies.js'
import path from 'path';
import { fileURLToPath } from 'url';
import * as socketio from 'socket.io';
import * as http from 'http';
<<<<<<< HEAD
import { GameRouter as $gameRouter } from './src/players/gameRouter.js';
=======
>>>>>>> multiplayer

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

//import { createGameState } from './src/app/game.js';

import fsModule from 'fs';
import { COOKIE_SECRET, MONGO_URI } from './src/authentication/secrets.js';

declare global {
    namespace Express {
        interface Request {
            player?: Player
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

    // connectDB();

    app.use(express.static('static'));


    // // Setup session MW
    // const session = expressSession({
    //     secret: COOKIE_SECRET,
    //     resave: false,
    //     saveUninitialized: false,
    //     store: connectMongo.create({
    //         mongoUrl: MONGO_URI,
    //         collectionName: 'sessions',
    //     }),
    //     cookie: {
    //         maxAge: 60000 * 1440
    //     }
    // });

    //express session({..}) initialization
    // app.use(session);

    // //init passport on every route call
    // app.use(passport.initialize());

    // // allow passport to use 'express-session'
    // app.use(passport.session());

    // initLocalStrategy(passport);

    registerStaticPaths(app);
<<<<<<< HEAD
=======

    app.use((req, res, next) => {
        res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
        res.locals.LOGIN_IDS = HTML_IDS;

        next();
    });

    configurePaths(app);
>>>>>>> multiplayer

    // runDBTest();


    // app.use((req, res, next) => {
    //     res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
    //     res.locals.LOGIN_IDS = HTML_IDS;
    //     next();
    // });



    configureRoutes(app);

    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }));

    app.set('views', './render-templates');
    app.set("view engine", ".hbs");

    const server = http.createServer(app);

    const io = new socketio.Server(server);

<<<<<<< HEAD

    io.on('connection', sock => {
        console.log('someone connected');
        sock.emit('message', 'You are connected');
        sock.on('message', (text) => { io.emit('message', text) });
    })

    let gameRouter: $gameRouter;


    io.on('connection', client => {
        // console.log('someone connected');
        // gameRouter = new gameRouter(io, client);
        // gameRouter.initGame();
        // const state = createGameState();

        // client.emit('message', 'You are connected');
        // client.on('message', (text) => { io.emit('message', text) });
        console.log('socket ID: ' + client.id);
        client.send(client.id);
        gameRouter.initGame(io, client);

=======
    let gameRouter = $gameRouter.GameRouterInstance;

    io.on('connection', client => {
        gameRouter.initGame(io, client);
        client.send(client.id);
        console.log(client.id);
>>>>>>> multiplayer
        //client.emit('message', 'You are connected');
        //client.on('message', (text) => { io.emit('message', text) });
        //client.emit('init', { client, state });
    });

<<<<<<< HEAD


    app.use((req, res, next) => {

        next();
    });

=======
>>>>>>> multiplayer
    io.on('disconnect', client => {
        gameRouter.playerDisconnect(client.id);
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
<<<<<<< HEAD
        res.render("index");

        if (req.isAuthenticated()) {
            //Already logged in, so display main app
=======

        if (req.isAuthenticated()) {
            //Already logged in, so display main app
            console.log('player: ' + req.player)
>>>>>>> multiplayer
            res.redirect("/main");
        } else {
            res.render("signup", { layout: 'landing' });
        }
    });

<<<<<<< HEAD
    app.get('/main', (req, res) => {
        if (req.isAuthenticated()) {
            // let gameRouter = $gameRouter.GameRouterInstance;
            // gameRouter.setReqUser(req.user);

=======



    app.get('/main', (req, res) => {
        if (req.isAuthenticated()) {
>>>>>>> multiplayer
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


