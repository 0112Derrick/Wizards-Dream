import connectMongo from 'connect-mongo';
import { LANDING_HTML_IDS, HTML_IDS } from './src/constants/HTMLElementIds.js';
import * as express from 'express';
import expressSession from 'express-session';
import exhbs from 'express-handlebars';
import passport from 'passport';
import initLocalStrategy from './src/authentication/passport-strategies.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as socketio from 'socket.io';
import * as http from 'http';
import { ClientMapSlot } from './src/players/GameRouter.js';
import connectDB from './src/db/db-init.js';
import playerRouter from './src/players/routes/PlayerRouter.js';
import { GameRouter as $gameRouter } from './src/players/GameRouter.js';
import fsModule from 'fs';
import { COOKIE_SECRET, MONGO_URI } from './src/authentication/secrets.js';
const fs = fsModule.promises;
(function start_server() {
    const app = express.default();
    connectDB();
    app.use(express.static('static'));
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
    app.use(session);
    app.use(passport.initialize());
    app.use(passport.session());
    initLocalStrategy(passport);
    registerStaticPaths(app);
    app.use((req, res, next) => {
        res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
        res.locals.HTML_IDS = HTML_IDS;
        next();
    });
    configureRoutes(app);
    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }));
    app.set('views', './render-templates');
    app.set("view engine", ".hbs");
    const server = http.createServer(app);
    const io = new socketio.Server(server);
    let gameRouter = $gameRouter.GameRouterInstance;
    io.on('connection', client => {
        gameRouter.setIO(io);
        gameRouter.setClientIP(client.handshake.headers.host);
        gameRouter.initGame(client);
        if (gameRouter.client) {
            gameRouter.setClientMap({
                id: client.handshake.headers.host,
                arg: gameRouter.client
            }, ClientMapSlot.ClientOBJ);
            console.log("server sent client info: " + client.emit("onlineClient", gameRouter.ClientMap.get(gameRouter.ClientIP)?.at(ClientMapSlot.ClientOBJ)));
        }
        client.emit('clientID', client.handshake.headers.host);
        console.log('server ', client.handshake.headers.host);
    });
    io.on('disconnect', client => {
        gameRouter.playerDisconnect(client.handshake.headers.host);
    });
    server.on('error', (err) => {
        console.error(err);
    });
    const PORT = process.env.Port ?? 8080;
    console.log("Server listening on port: " + PORT);
    server.listen(PORT);
})();
function registerStaticPaths(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
            console.log('player: ' + req.user);
            $gameRouter.GameRouterInstance.setClient(req.user);
            res.redirect("/main");
        }
        else {
            res.render("signup", { layout: 'landing' });
        }
    });
    app.get('/main', (req, res) => {
        if (req.isAuthenticated()) {
            function requestUserInfo() {
                $gameRouter.GameRouterInstance.setClient(req.user);
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
//# sourceMappingURL=server.js.map