import exhbs from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import exp from 'constants';
import { nextTick } from 'process';

(function start_server() {
    const app = express();
    registerStaticPaths(app);
    configurePaths(app);
    app.engine('hbs', exhbs({
        defaultLayout: "index",
        extname: '.hbs',
    }))
    app.set('views', './render-templates');
    app.set("view engine", ".hbs");

    const PORT = process.env.Port ?? 8080;
    console.log("Server listening on port: " + PORT);
    app.listen(PORT);

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