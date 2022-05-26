require("dotenv").config();

const LocalStrategy = require("passport-local");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectId;
const bcrypt = require("bcrypt");

/*
 * param: app (express application)
 * param: database (MongoDB client database)
 * use: adds authentication strategies and user
 *  cookie serialization and deserialization
 */
function auth(app, database) {
    const userCollection = database.collection("users");

    //Serializes a user into a user id
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    //Deserializes a user id into a user
    passport.deserializeUser(function(id, done) {
        userCollection.findOne({
                _id: new ObjectID(id)
            },
            function(err, doc) {
                done(null, doc);
            })
    });

    //Adds local authentication for users logging in
    //through the website
    passport.use(new LocalStrategy(
        function(username, password, done) {
            userCollection.findOne({
                    username: username
                },
                function(err, user) {
                    if (err) return done(err);
                    if (!user) return done(null, false);
                    if (!bcrypt.compareSync(password, user.password)) return done(null, false);
                    return done(null, user)
                })
        }
    ));
}

//Middleware for determining if a user has been authenticated
function ensureAuthenticated() {
    return function (req, res, next) {
        if (req.isAuthenticated()) return next()
        res.status(511).send()
    }
}

module.exports = {
    auth: auth,
    ensureAuthenticated: ensureAuthenticated
}