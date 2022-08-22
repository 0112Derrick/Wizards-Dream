import passportLocal from 'passport-local';
import PlayerModel from '../players/PlayerDBModel.js';
const localStrategy = passportLocal.Strategy;
export default function (passport) {
    passport.use(new localStrategy({
        usernameField: 'email '
    }, async function (email, password, done) {
        await PlayerModel.findOne({ email: email }, function (err, user) {
            let info;
            if (!user) {
                console.log("User not found", email);
                info = { messge: 'User not found' };
            }
            else if (!user.validPassword(password)) {
                console.log('Invalid Password', password);
                info = { message: 'Invalid Password' };
                err = true;
            }
            else {
                console.log("Found user", email);
            }
            return done(err, user, info);
        });
    }));
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function (id, done) {
        PlayerModel.findById(id, function (err, user) {
            done(err, user);
        });
    });
}
;
//# sourceMappingURL=passport-strategies.js.map