<<<<<<< HEAD
import express, { request, Router } from 'express'
import * as db_api from '../../db/db-api.js';
import { StatusConstants as $StatusConstants } from '../../constants/StatusConstants.js';
import Player, { Player as $player } from '../Player.js';
import passportStrategies from "../../authentication/passport-strategies.js";
import passport from 'passport';
import { StatusConstants } from '../../constants/StatusConstants.js';
=======
import express, { Router } from 'express'
import * as db_api from '../../db/db-api.js';
import { StatusConstants as $StatusConstants } from '../../constants/StatusConstants.js';
import { Player as $player } from '../Player.js';
import passportStrategies from "../../authentication/passport-strategies.js";
import passport from 'passport';

>>>>>>> multiplayer
import { equal } from 'assert';

const playerRouter: Router = express.Router();
/* express.urlencoded() */
// Signup Request

/** 
 * @description
 * The route used when the contact form is submitted.
 * Expects contact request in JSON {email, subject, body}
 * If email is a valid format, saves form info to DB and sends notification
 * email to admin with contents of form.
 * If email is invalid, returns a status indicating 400 so the client can notify
 * the contact appropriately.
 */

playerRouter.post('/signup', express.json(), async function (req, res, next) {
    if (req.body.email && req.body.password && req.body.username) {
<<<<<<< HEAD
        
=======

>>>>>>> multiplayer
        const player = await db_api.addPlayer({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
<<<<<<< HEAD
        }).then((player) => { console.log("Added player", player); })
=======
        }).then((player) => { console.log("Added player", player) })
>>>>>>> multiplayer
            .catch((err) => { console.log("Failed to add player") })
            .finally(() => res.redirect('/'));
    } else {
        res.status($StatusConstants.CLIENT_ERROR_BASE);
        res.redirect('/');
        console.log('Cannot validate user');
    }
});

//Login request
playerRouter.post('/login', express.json(), function (req, res, next) {

    passport.authenticate('local', function (err, user, info, status) {
        if (err) {
            console.log('Invalid password');
            return res.sendStatus($StatusConstants.INVALID_PASSWORD);
        }
        if (!user) {
            console.log('Failed to find user');
            return res.sendStatus($StatusConstants.USER_NOT_FOUND);
        }
        req.logIn(user, function (err) {
            if (err) { return next(err) }
            console.log($StatusConstants.OK);
<<<<<<< HEAD
            req.player = new $player();
            //console.log(user);
            let userData = {
                username: user.username,
                email: user.email,
                characters: user.characters,
            };
            req.player.setData(userData);
            return res.sendStatus($StatusConstants.OK);
        });

        return;
=======
            return res.sendStatus($StatusConstants.OK);
        });

        return 0;
>>>>>>> multiplayer
    })(req, res, next);
});

playerRouter.post('/logout', (req, res) => {
    req.session.destroy(function (err) {
        if (err) return res.sendStatus($StatusConstants.SERVER_ERROR_BASE);
        return res.sendStatus($StatusConstants.OK);
    })
<<<<<<< HEAD
})

playerRouter.post('/*', (req, res) => {
    return res.sendStatus($StatusConstants.RESOURCE_NOT_FOUND);
})
=======
});

playerRouter.post('/*', (req, res) => {
    return res.sendStatus($StatusConstants.RESOURCE_NOT_FOUND);
});
>>>>>>> multiplayer

playerRouter.use((error, req, res, next) => {
    console.log("Error: ", error);
    res.sendStatus(error.sendStatus);
    next();
});


export default playerRouter;