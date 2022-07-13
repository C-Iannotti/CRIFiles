require("dotenv").config()

const https = require("https");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const cors = require("cors");
const LocalStrategy = require("passport-local").Strategy;
const { MongoClient } = require("mongodb");
const MongoStore = require("connect-mongo");
const DB = require("./connection.js");
const paths = require("./paths.js");
const { auth } = require("./auth.js");

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;


//Sets express properties: including engine, url reading and encoding,
// and the React App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./client/build"));

//Sets CORS policies
app.use(
    cors({
        origin: process.env.WHITELISTED_DEV,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        exposedHeaders: "Content-Disposition,Content-Type"
    })
)

//Initializes express session with cookies
app.use(session({
    store: MongoStore.create({
        mongoUrl:  MONGO_URI
    }),
    resave: true,
    secret: SESSION_SECRET,
    saveUninitialized: true,
    cookie: {
        secure: process.env.PROTOCOL === "https://",
        sameSite: process.env.PROTOCOL === "https://" ? "none" : "lax",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8
    },
    key: "express.sid"
}));

//Initializes passport
app.use(passport.initialize());
app.use(passport.session());

//Adds database connection, the routes for the application, and passport authentication
DB(async (client) => {
    const database = await client.db("file-sharer-website");
    paths(app, database);
    auth(app, database);

    //Adds default path for serving static files
    app.get("*", (req, res) => {
        res.sendFile(__dirname + "/client/build/index.html");
    });
});

if (process.env.PROTOCOL === "https://") {
    const credentials = {
        key: fs.readFileSync("./localhost-key.pem"),
        cert: fs.readFileSync("./localhost.pem")
    };
    https.createServer(credentials, app).listen(PORT);
}
else {
    app.listen(PORT);
}
