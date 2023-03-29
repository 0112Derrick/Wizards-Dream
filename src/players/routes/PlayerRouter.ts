import express, { Router } from 'express'
import * as db_api from '../../db/db-api.js';
import { StatusConstants as $StatusConstants } from '../../constants/StatusConstants.js';
import { Player as $player } from '../Player.js';
import passportStrategies from "../../authentication/passport-strategies.js";
import passport from 'passport';
import { Sprite } from "../../app/Sprite.js"

import { equal } from 'assert';
import { MapNames } from '../../constants/MapNames.js';

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

        const player = await db_api.addPlayer({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        }).then((player) => { console.log("Added player", player) })
            .catch((err) => { console.log("Failed to add player") })
            .finally(() => res.redirect('/'));
    } else {
        res.status($StatusConstants.CLIENT_ERROR_BASE);
        res.redirect('/');
        console.log('Cannot validate user');
    }
});



playerRouter.post('/savecharacter', express.json(), async function (req, res, next) {
    if (req.body.username && req.body.characterGender) {
        try {
            const character = await db_api.addCharacter({
                username: req.body.username,
                characterGender: req.body.characterGender,
                player: req.user.id,
                x: 0,
                y: 0,
                sprite: req.body.sprite,
                direction: req.body.direction || 'right',
                width: req.body.width,
                height: req.body.height,
                location: MapNames.GrassyField,
                xVelocity: req.body.xVelocity,
                yVelocity: req.body.yVelocity,
                name: req.body.name,
                gameObjectID: req.body.gameObjectID,
            });
            console.log("Added character ", character);
            req.user.characters.push(character.id);// character.id;
            req.user.save();
            res.redirect('/');
        }
        catch (err) { console.log("Failed to save character"); res.redirect('/') }

    } else {
        res.status($StatusConstants.CLIENT_ERROR_BASE);
        res.redirect('/');
        console.log("Cannot save character");
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

            return res.sendStatus($StatusConstants.OK);
        });

        return 0;
    })(req, res, next);
});

playerRouter.post('/logout', (req, res) => {
    req.session.destroy(function (err) {
        if (err) return res.sendStatus($StatusConstants.SERVER_ERROR_BASE);
        return res.sendStatus($StatusConstants.OK);
    })
});

playerRouter.post('/*', (req, res) => {
    return res.sendStatus($StatusConstants.RESOURCE_NOT_FOUND);
});

playerRouter.use((error, req, res, next) => {
    console.log("Error: ", error);
    res.sendStatus(error.sendStatus);
    next();
});


export default playerRouter;