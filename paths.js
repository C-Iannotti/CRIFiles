require("dotenv").config()

const passport = require("passport");
const bcrypt = require("bcrypt");
const MongoDB = require("mongodb");
const { pipeline } = require("node:stream/promises");
const fs = require("fs");
const multer = require("multer");

const { ensureAuthenticated } = require("./auth.js");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);

/*
 * param: app (express application)
 * param: database (MongoDB client database)
 * use: adds API paths to app that uses database
     for storage
 */
function main(app, database) {
    const userCollection = database.collection("users");
    const fileCollection = database.collection("files");
    const fileBucket = new MongoDB.GridFSBucket(database, { bucketName: "file-bucket"});

    //API path for registering a user
    app.post(process.env.REGISTER_PATH,
        function(req, res, next) {
            const username = req.body.username;
            const password = req.body.password;

            userCollection.findOne({
                    username: username
                },
                function(err, user) {
                    if (err) res.status(400).send();
                    else if (user) res.status(400).send();
                    else {
                        const salt = bcrypt.genSaltSync(SALT_ROUNDS);
                        const hash = bcrypt.hashSync(password, salt);
                        userCollection.insertOne({
                                username: username,
                                password: hash
                            },
                            function(err, doc) {
                                if(err) res.status(400).send();
                                next(null, doc);
                            }
                        )
                    }
                }
            )
        },
        passport.authenticate("local", { failureRedirect: "/" }),
        function(req, res) {
            res.status(204).send();
        }
    );

    //API path for logging in a user
    app.post(process.env.LOGIN_PATH,
        passport.authenticate("local", { failureRedirect: "/" }),
        function(req, res) {
            res.status(204).send();
        }
    );

    //API path for uploading a file to database
    app.post(process.env.UPLOAD_PATH,
        ensureAuthenticated(),
        multer( { dest: process.env.DATA_PATH}).single("userFile"),
        function(req, res) {
            res.status(204);
            try {
                const stream = fileBucket.openUploadStream(req.file.filename, {
                    chunkSizeBytes: 1048576,
                    metadata: { mimetype: req.file.mimetype, name: req.file.originalname }
                });
                fs.createReadStream(req.file.destination + req.file.filename).pipe(stream);

                fileCollection.insertOne({
                        user: req.user._id,
                        file: stream.id,
                        fileName: req.file.originalname,
                        privacy: "public",
                        validUsers: [],
                        size: req.file.size
                    },
                    function(err, doc) {
                        if (err) res.status(400);
                    }
                )
            } catch(e) {
                console.error(e)
                res.status(400);
            } finally {
                fs.rm(process.env.DATA_PATH + req.file.filename, err => {
                    if (err) console.error(err);
                });
            }

            res.send();
        }
    );

    //API for retrieving all of a user's file meta data
    app.get(process.env.USER_FILES_PATH,
        ensureAuthenticated(),
        function(req, res) {
            fileCollection.find({ user: req.user._id })
                .toArray(function(err, docs) {
                    if (err) res.status(500).send({ error: err});
                    res.send(docs);
                })
        }
    );

    //API for retrieving a single file
    app.get(process.env.RETRIEVE_FILE_PATH + "/:fileId",
        ensureAuthenticated(),
        function(req, res) {
            res.status(200);

            const cursor = fileBucket.find({ _id: MongoDB.ObjectId(req.params.fileId) });
            cursor.next((err, doc) => {
                if (err) res.status(500).send();
                else if (!doc) res.status(500).send();
                else {
                    res.append("Content-Type", doc.metadata.mimetype);
                    res.append("filename", doc.metadata.name);
                    fileBucket.openDownloadStream(MongoDB.ObjectId(req.params.fileId))
                        .pipe(res);
                }
            })
        }
    );
}

module.exports = main