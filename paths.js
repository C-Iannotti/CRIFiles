require("dotenv").config()

const passport = require("passport");
const bcrypt = require("bcrypt");
const MongoDB = require("mongodb");
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
                    if (err || user) res.status(400).send();
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
                        _id: stream.id,
                        fileName: req.file.originalname,
                        privacy: req.body.privacy,
                        trustedUsers: req.body.trustedUsers,
                        size: req.file.size,
                        mimetype: req.file.mimetype,
                        comment: req.body.comment
                    },
                    function(err, doc) {
                        if (err) res.status(400);
                    }
                )
            } catch(e) {
                console.error(e);
                res.status(400);
            } finally {
                fs.rm(process.env.DATA_PATH + req.file.filename, err => {
                    if (err) console.error(err);
                });
            }

            res.send();
        }
    );

    //API for retrieving page of user's files' metadata
    app.get(process.env.USER_FILES_PATH + "/:pageNum",
        ensureAuthenticated(),
        function(req, res) {
            fileCollection.find({
                    user: req.user._id
                },
                {
                    limit: Number(process.env.PAGE_SIZE),
                    sort: { _id: 1},
                    skip: Number(process.env.PAGE_SIZE) * Number(req.params.pageNum)
                }).toArray(function(err, docs) {
                        if (err || docs === null) res.status(500).send()
                        else {
                            res.json({
                                files: docs
                            })
                        }
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
                if (err || !doc) res.status(500).send();
                else {
                    res.append("Content-Type", doc.metadata.mimetype);
                    res.append("filename", doc.metadata.name);
                    fileBucket.openDownloadStream(MongoDB.ObjectId(req.params.fileId))
                        .pipe(res);
                }
            })
        }
    );

    //API for deleting a single file
    app.delete(process.env.DELETE_FILE_PATH + "/:fileId",
        ensureAuthenticated(),
        function(req, res) {
            fileCollection.findOneAndDelete({
                    user: MongoDB.ObjectId(req.user._id),
                    _id: MongoDB.ObjectId(req.params.fileId)
                },
                function(err, doc) {
                    if (err || doc === null) res.status(400).send();
                    else {
                        fileBucket.delete(doc.value._id);
                        fileCollection.delete
                        res.status(204).send();
                    }
                }
            );
        }
    );

    //API for getting a file's meta data
    app.get(process.env.RETRIEVE_METADATA_PATH + "/:fileId",
        ensureAuthenticated(),
        function(req, res) {
            fileCollection.findOne({
                    _id: MongoDB.ObjectId(req.params.fileId)
                },
                function(err, doc) {
                    if (err || doc === null) res.status(500).send();
                    else {
                        res.json({
                            userId: doc.user,
                            fileId: doc._id,
                            filename: doc.fileName,
                            privacy: doc.privacy,
                            trustedUsers: doc.trustedUsers,
                            size: doc.size,
                            mimetype: doc.mimetype,
                            isUsers: doc.user.toString() === req.user._id.toString(),
                            comment: doc.comment
                        });
                    }
                }
            );
        }
    );

    //API for updating a file's metadata
    app.put(process.env.UPDATE_METADATA_PATH,
        ensureAuthenticated(),
        function(req, res) {
            fileCollection.findOneAndUpdate({
                    _id: MongoDB.ObjectId(req.body.fileId),
                    user: MongoDB.ObjectId(req.user._id)
                },
                { "$set": {
                    comment: req.body.comment,
                    trustedUsers: req.body.trustedUsers,
                    privacy: req.body.privacy
                }},
                function(err, doc) {
                    if (err || doc === null) res.status(500).send();
                    else {
                        doc = doc.value
                        res.json({
                            userId: doc.user,
                            fileId: doc._id,
                            filename: doc.fileName,
                            privacy: doc.privacy,
                            trustedUsers: doc.trustedUsers,
                            size: doc.size,
                            mimetype: doc.mimetype,
                            isUsers: doc.user.toString() === req.user._id.toString(),
                            comment: doc.comment
                        });
                    };
                }
            );
        }
    );
}

module.exports = main