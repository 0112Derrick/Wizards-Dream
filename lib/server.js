import { LANDING_HTML_IDS, HTML_IDS } from './src/constants/HTMLElementIds.js';
import * as express from 'express';
import exhbs from 'express-handlebars';
import passport from 'passport';
import initLocalStrategy from './src/authentication/passport-strategies.js';
import path from 'path';
import { fileURLToPath } from 'url';
import * as socketio from 'socket.io';
import * as http from 'http';
import playerRouter from './src/players/routes/PlayerRouter.js';
import fsModule from 'fs';
const fs = fsModule.promises;
(function start_server() {
    const app = express.default();
    app.use(express.static('static'));
    initLocalStrategy(passport);
    registerStaticPaths(app);
    app.use((req, res, next) => {
        res.locals.LANDING_HTML_IDS = LANDING_HTML_IDS;
        res.locals.LOGIN_IDS = HTML_IDS;
        next();
    });
    configurePaths(app);
    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }));
    app.set('views', './render-templates');
    app.set("view engine", ".hbs");
    const server = http.createServer(app);
    const io = new socketio.Server(server);
    io.on('connection', client => {
        console.log('someone connected');
        client.emit('message', 'You are connected');
        client.on('message', (text) => { io.emit('message', text); });
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
function configurePaths(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.get("/", (req, res, next) => {
        res.render("signup", { layout: 'landing' });
    });
    app.get('/main', (req, res) => {
        res.render('index', { layout: 'index' });
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