require("dotenv").config()

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

const DOMAIN = process.env.DOMAIN;
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;


//Sets express properties: including engine, url reading and encoding,
// and the React App
const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./client/build"));

//Sets CORS policies
app.use(
    cors({
        origin: process.env.WHITELISTED_DEV,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        exposedHeaders: "Content-Disposition,filename"
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
    cookie: {secure: false},
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
});

app.listen(PORT);
