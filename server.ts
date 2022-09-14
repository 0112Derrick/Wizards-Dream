import exhbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import * as express from 'express';
import * as socketio from 'socket.io';
import { Overworld } from '/Overworld.js';
import * as http from 'http';
<<<<<<< Updated upstream
=======
import { GameRouter } from './src/players/gameRouter.js';

>>>>>>> Stashed changes
import exp from 'constants';
import { nextTick } from 'process';

(function start_server() {
    const app = express.default();

    registerStaticPaths(app);
    configurePaths(app);


    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }))

    app.set('views', './render-templates');
    app.set("view engine", ".hbs");

    const server = http.createServer(app);
    const io = new socketio.Server(server);

<<<<<<< Updated upstream
    io.on('connection', sock => {
        console.log('someone connected');
        sock.emit('message', 'You are connected');
        sock.on('message', (text) => { io.emit('message',text) });
    })
=======
    let gameRouter: GameRouter;


    io.on('connection', client => {
        // console.log('someone connected');
        gameRouter = new GameRouter(io, client);
        gameRouter.initGame();
        // const state = createGameState();

        // client.emit('message', 'You are connected');
        // client.on('message', (text) => { io.emit('message', text) });
        //client.emit('init', { client, state });
    });
>>>>>>> Stashed changes



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

function configurePaths(app) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.get("/", (req, res, next) => {
        res.render("index");
    });

    app.get("/character", (req, res) => {
        res.render("index");
    })

}