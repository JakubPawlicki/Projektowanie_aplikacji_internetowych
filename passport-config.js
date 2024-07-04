const passport = require('passport');
const connection = require("./database");
const bcrypt = require('bcrypt');
const { Strategy: LocalStrategy } = require("passport-local");

const authUser = (email, password, done) => {
    connection.query('SELECT * FROM user WHERE user_email = ?', [email], async (error, result) => {
        if (error) {
            return done(error);
        }
        if (result.length == 0) {
            return done(null, false, { message: 'Nieprawidłowy email!' });
        } else {
            const user = result[0];
            const match = await bcrypt.compare(password, user.user_password);
            if (!match) {
                return done(null, false, { message: 'Nieprawidłowe hasło!' });
            } else {
                let authenticated_user = { id: user.user_id, name: user.user_email };
                return done(null, { authenticated_user });
            }
        }
    });
}

passport.use(new LocalStrategy({ usernameField: 'email' }, authUser));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
