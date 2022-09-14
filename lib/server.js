import exhbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import * as express from 'express';
import * as socketio from 'socket.io';
import * as http from 'http';
<<<<<<< Updated upstream
=======
import { GameRouter } from './src/players/gameRouter.js';
import connectDB from './src/db/db-init.js';
import playerRouter from './src/players/routes/PlayerRouter.js';
import fsModule from 'fs';
import { COOKIE_SECRET, MONGO_URI } from './src/authentication/secrets.js';
const fs = fsModule.promises;
>>>>>>> Stashed changes
(function start_server() {
    const app = express.default();
    registerStaticPaths(app);
    configurePaths(app);
    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }));
    app.set('views', './render-templates');
    app.set("view engine", ".hbs");
    const server = http.createServer(app);
    const io = new socketio.Server(server);
<<<<<<< Updated upstream
    io.on('connection', sock => {
        console.log('someone connected');
        sock.emit('message', 'You are connected');
        sock.on('message', (text) => { io.emit('message', text); });
=======
    let gameRouter;
    io.on('connection', client => {
        gameRouter = new GameRouter(io, client);
        gameRouter.initGame();
>>>>>>> Stashed changes
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
    app.use('/src/html', express.static(path.join(__dirname, './src/html')));
    app.use('/favicon', express.static(path.join(__dirname, './favicon/')));
    app.use('/css', express.static(path.join(__dirname, './css/')));
    app.use('/images', express.static(path.join(__dirname, './images/')));
    app.use('/', express.static(path.join(__dirname, '/')));
}
function configurePaths(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.get("/", (req, res, next) => {
        res.render("index");
    });
    app.get("/character", (req, res) => {
        res.render("index");
    });
}
//# sourceMappingURL=server.js.map