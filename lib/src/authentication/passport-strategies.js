import passportLocal from 'passport-local';
import PlayerModel from "../game-server/PlayerDBModel.js";
const localStrategy = passportLocal.Strategy;
export default function (passport) {
    passport.use(new localStrategy({
        usernameField: 'email'
    }, async function (email, password, done) {
        PlayerModel.findOne({ email: email }).populate('characters').exec(function (err, user) {
            let info;
            console.log('email:', email, ' password: ', password);
            if (!user) {
                console.log("User not found", email);
                info = { messge: 'User not found' };
            }
            else if (!user.validPassword(password)) {
                console.log('Invalid Password', password);
                info = { message: 'Invalid Password' };
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
            return done(err, user);
        });
    });
}
;
//# sourceMappingURL=passport-strategies.js.map