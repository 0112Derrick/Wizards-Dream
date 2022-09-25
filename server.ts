

import connectMongo from 'connect-mongo';
//import { LANDING_HTML_IDS, HTML_IDS } from './src/constants/HTMLElementIds.js';
import expressSession from 'express-session';
import exhbs, { ExpressHandlebars } from 'express-handlebars';
import passport from 'passport'
import initLocalStrategy from './src/authentication/passport-strategies.js'
import path from 'path';
import { fileURLToPath } from 'url';
import * as express from 'express';
import * as socketio from 'socket.io';
import { Overworld } from '/Overworld.js';
import * as http from 'http';
import { GameRouter as $gameRouter } from './src/players/gameRouter.js';

import exp from 'constants';
import { nextTick } from 'process';

(function start_server() {
    const app = express.default();

    registerStaticPaths(app);



    // app.use((req, res, next) => {
    //     res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
    //     res.locals.LOGIN_IDS = HTML_IDS;
    //     next();
    // });



    configureRoutes(app);

    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }))

    app.set('views', './render-templates');
    app.set("view engine", ".hbs");

    const server = http.createServer(app);
    const io = new socketio.Server(server);


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

        //client.emit('message', 'You are connected');
        //client.on('message', (text) => { io.emit('message', text) });
        //client.emit('init', { client, state });
    });



    app.use((req, res, next) => {

        next();
    });

    io.on('disconnect', client => {
        gameRouter.playerDisconnect(client.id);
    })

    server.on('error', (err) => {
        console.error(err);
    });

    const PORT = process.env.Port ?? 8080;
    console.log("Server listening on port: " + PORT);
    server.listen(PORT);
    //app.listen(PORT);

})();

function registerStaticPaths(app) {
    // Set __dirname
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    //Register static paths for loading modules
    app.use('/src/app', express.static(path.join(__dirname, './src/app')));
    app.use('/src/html', express.static(path.join(__dirname, './src/html')));
    app.use('/favicon', express.static(path.join(__dirname, './favicon/')));
    app.use('/css', express.static(path.join(__dirname, './css/')));
    app.use('/images', express.static(path.join(__dirname, './images/')));
    app.use('/', express.static(path.join(__dirname, '/')));
}

function configureRoutes(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.get("/", (req, res, next) => {
        res.render("index");

        if (req.isAuthenticated()) {
            //Already logged in, so display main app
            res.redirect("/main");
        } else {
            res.render("signup", { layout: 'landing' });
        }
    });

    app.get('/main', (req, res) => {
        if (req.isAuthenticated()) {
            // let gameRouter = $gameRouter.GameRouterInstance;
            // gameRouter.setReqUser(req.user);

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
    })

}