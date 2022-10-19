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
    app.set('trust proxy', true);
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
    gameRouter.setIO(io);
    let id = 0;
    io.on('connection', clientSocket => {
        console.log("connecting client: " + clientSocket.handshake.address);
        if (gameRouter.getClient(clientSocket.handshake.address)) {
            if (!gameRouter.getClientMap().has(clientSocket.handshake.address)) {
                let mapArr = [];
                console.log('new Client Added: ', clientSocket.handshake.address);
                gameRouter.getClientMap().set(clientSocket.handshake.address, mapArr);
            }
            if (!gameRouter.getClientMap().get(clientSocket.handshake.address).at(ClientMapSlot.ClientSocket)) {
                let clientSocketOBJ = {
                    id: clientSocket.handshake.address,
                    arg: clientSocket
                };
                console.log("Client socket set", clientSocket.handshake.address);
                gameRouter.setClientMap(clientSocketOBJ, ClientMapSlot.ClientSocket);
            }
            if (!gameRouter.getClientMap().get(clientSocket.handshake.address).at(ClientMapSlot.ClientOBJ)) {
                let clientOBJ = {
                    id: clientSocket.handshake.address,
                    arg: gameRouter.getClient(clientSocket.handshake.address)
                };
                gameRouter.setClientMap(clientOBJ, ClientMapSlot.ClientOBJ);
            }
            clientSocket.emit('clientID', clientSocket.handshake.address);
            console.log("server sent client info: " + clientSocket.emit("onlineClient", gameRouter.getClientMap().get(clientSocket.handshake.address)?.at(ClientMapSlot.ClientOBJ)));
            gameRouter.setIO(io);
            gameRouter.initGame(clientSocket, clientSocket.handshake.address);
        }
        else {
            clientSocket.emit("reconnect");
        }
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
            async function requestUserInfo() {
                let clientOBJ = await req.user.populate('characters');
                console.log("IP: " + req.ip + "\n player: " + req.user + "\n");
                $gameRouter.GameRouterInstance.setClientIP(req.ip);
                $gameRouter.GameRouterInstance.setClient(clientOBJ, req.ip);
            }
            requestUserInfo();
            res.redirect("/main");
        }
        else {
            res.render("signup", { layout: 'landing' });
        }
    });
    app.get('/main', (req, res) => {
        if (req.isAuthenticated()) {
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
//# sourceMappingURL=server.js.map