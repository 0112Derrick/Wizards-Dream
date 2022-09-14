import express from 'express';
import * as db_api from '../../db/db-api.js';
import { StatusConstants as $StatusConstants } from '../../constants/StatusConstants.js';
import passport from 'passport';
const playerRouter = express.Router();
playerRouter.post('/signup', express.json(), async function (req, res, next) {
    if (req.body.email && req.body.password && req.body.username) {
        const player = await db_api.addPlayer({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        }).then((player) => { console.log("Added player", player); })
            .catch((err) => { console.log("Failed to add player"); })
            .finally(() => res.redirect('/'));
    }
    else {
        res.status($StatusConstants.CLIENT_ERROR_BASE);
        res.redirect('/');
        console.log('Cannot validate user');
    }
});
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
            if (err) {
                return next(err);
            }
            console.log($StatusConstants.OK);
            return res.sendStatus($StatusConstants.OK);
        });
        return;
    })(req, res, next);
});
playerRouter.post('/logout', (req, res) => {
    req.session.destroy(function (err) {
        if (err)
            return res.sendStatus($StatusConstants.SERVER_ERROR_BASE);
        return res.sendStatus($StatusConstants.OK);
    });
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
//# sourceMappingURL=PlayerRouter.js.map