require("dotenv").config()

const passport = require("passport");
const bcrypt = require("bcrypt");
const MongoDB = require("mongodb");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const { ensureAuthenticated } = require("./auth.js");
const { send } = require("process");

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

    userCollection.createIndex({ displayname: "text" })
    fileCollection.createIndex({ filename: "text" })

    //API path for registering a user
    app.post(process.env.REGISTER_PATH,
        function(req, res, next) {
            const username = req.body.username || "";
            const password = req.body.password || "";
            const displayname = req.body.displayname || "";

            if (!username.match(new RegExp(process.env.USERNAME_VERIFICATION))) {
                res.status(400).json({ errorMessage: "Invalid username"});
            }
            else if (!password.match(new RegExp(process.env.PASSWORD_VERIFICATION))) {
                res.status(400).json({ errorMessage: "Invalid password"});
            }
            else if (!displayname.match(new RegExp(process.env.DISPLAYNAME_VERIFICATION))) {
                res.status(400).json({ errorMessage: "Invalid displayname"});
            }
            else {
                userCollection.findOne({
                        username: username
                    },
                    function(err, user) {
                        if (err) res.status(500).json({ errorMessage: "Server error"});
                        else if (user) res.status(400).json({ errorMessage: "Username already exists"});
                        else {
                            const salt = bcrypt.genSaltSync(SALT_ROUNDS);
                            const hash = bcrypt.hashSync(password, salt);
                            userCollection.insertOne({
                                    username: username,
                                    password: hash,
                                    displayname: displayname
                                },
                                function(err, doc) {
                                    if(err) res.status(500).json({errorMessage: "Server error"});
                                    next(null, doc);
                                }
                            )
                        }
                    }
                )
            }
        },
        function(req, res) {
            passport.authenticate("local", function(err, user) {
                if (err || !user) res.status(500).json({ errorMessage: "Failed to register user" });
                else {
                    req.logIn(user, function(err) {
                        if (err) res.status(500).json({ errorMessage: "Failed to login to registerd user"});
                        else res.status(204).send();
                    })
                }
            })(req, res)
        }
    );

    //API path for logging in a user
    app.post(process.env.LOGIN_PATH,
        function(req, res) {
            passport.authenticate("local", function(err, user) {
                if (err) res.status(500).json({ errorMessage: "Server failed while logging in" });
                else if (!user) res.status(500).json({ errorMessage: "Incorrect username/password"});
                else {
                    req.logIn(user, function(err) {
                        if (err) res.status(500).json({ errorMessage: "Failed to login to registerd user"});
                        else res.status(204).send();
                    });
                }
            })(req, res)
        }
    );

    //API path for logging out user
    app.get(process.env.LOGOUT_PATH,
        ensureAuthenticated(),
        function(req, res) {
            req.logout();
            res.clearCookie("express.sid");
            res.status(204).send();
        })

    //API path for retrieving a display name
    app.get(process.env.DISPLAYNAME_PATH,
        function(req, res) {
            if (!req.user) res.json({ displayname: null })
            else res.json({ displayname: req.user.displayname })
        })

    //API for getting page of users with a given text in displayname or id
    app.get(process.env.RETRIEVE_USERS_PATH + "/:userText/:pageNum",
        ensureAuthenticated(),
        function(req, res) {
            let objectId;
            try {
                objectId = MongoDB.ObjectId(req.params.userText)
            }
            catch {
                objectId = null
            }

            if (objectId) {
                userCollection.findOne({ _id: objectId },
                (err, doc) => {
                    if (err || doc === null) res.status(500).send();
                    else {
                        res.json({
                            users: [{
                                displayname: doc.displayname,
                                _id: doc._id
                            }]
                        })
                    }
                });
            }
            else {
                userCollection.find({
                    displayname: {
                        $regex: "^" + req.params.userText
                    }
                },
                {
                    limit: Number(process.env.PAGE_SIZE) + 1,
                    skip: Number(process.env.PAGE_SIZE) * Number(req.params.pageNum)
                }).toArray((err, docs) => {
                    if (err || docs === null) res.status(500).send()
                    else {
                        res.json({
                            users: docs.slice(0, process.env.PAGE_SIZE).map(x => ({
                                displayname: x.displayname,
                                _id: x._id,
                            })),
                            moreSearchedUsers: docs.length === Number(process.env.PAGE_SIZE) + 1
                        });
                    }
                });
            }
        })

    //API path for uploading a file to database
    app.post(process.env.UPLOAD_PATH,
        ensureAuthenticated(),
        multer( { dest: process.env.DATA_PATH}).single("userFile"),
        function(req, res) {            
            try {
                const stream = fileBucket.openUploadStream(req.file.filename, {
                    chunkSizeBytes: 1048576,
                    metadata: { mimetype: req.file.mimetype, name: req.file.originalname }
                });
                fs.createReadStream(req.file.destination + req.file.filename).pipe(stream);

                fileCollection.insertOne({
                        _id: stream.id,
                        user: req.user._id,
                        displayname: req.user.displayname,
                        filename: req.file.originalname,
                        privacy: req.body.privacy,
                        trustedUsers: JSON.parse(req.body.trustedUsers),
                        size: req.file.size,
                        mimetype: req.file.mimetype,
                        comment: req.body.comment,
                        token: crypto.randomBytes(48).toString("base64url")
                    },
                    function(err, doc) {
                        if (err) res.status(400).json({
                            errorMessage: "Error registering file"
                        });
                        else {
                            res.status(204).send();
                        }
                    }
                )
            } catch(e) {
                console.error(e);
                res.status(400).json({
                    errorMessage: "Error uploading file"
                });
            } finally {
                fs.rm(process.env.DATA_PATH + req.file.filename, err => {
                    if (err) console.error(err);
                });
            }
        }
    );

    //API for retrieving page of files' metadata
    app.post(process.env.USER_FILES_PATH + "/:pageNum",
        (req, res) => {
            let searchObject = {}
            if (req.body.file) {
                try {
                    searchObject["_id"] = MongoDB.ObjectId(req.body.file);
                }
                catch {
                    try {
                        searchObject["filename"] = {
                            $regex: "^" + req.body.file
                        };
                    }
                    catch (err) {
                        console.error("Invalid sent file");
                    }
                }
            }

            if (req.body.user) {
                try {
                    searchObject["user"] = MongoDB.ObjectId(req.body.user);
                }
                catch {
                    try {
                        searchObject["displayname"] = {
                            $regex: "^" + req.body.user
                        };
                    }
                    catch (err) {
                        console.error("Invalid sent user");
                    }
                }
            }

            if (req.body.getUserFiles) {
                fileCollection.count(Object.assign({}, {
                    user: req.user._id
                }, searchObject),
                (err, count) => {
                    if (err) res.status(500).send();
                    else {
                        fileCollection.find(Object.assign({}, {
                            user: req.user._id
                        }, searchObject),
                        {
                            limit: Number(process.env.PAGE_SIZE),
                            sort: { _id: 1},
                            skip: Number(process.env.PAGE_SIZE) * Number(req.params.pageNum)
                        }).toArray((err, docs) => {
                                if (err || docs === null) res.status(500).send()
                                else {
                                    res.json({
                                        files: docs,
                                        totalFiles: count
                                    })
                                }
                        });
                    }
                })
            }
            else if (req.user) {
                fileCollection.count(Object.assign({}, {
                    "$or": [
                        {
                            user: req.user._id
                        },
                        {
                            privacy: "private",
                            [`trustedUsers.${req.user._id}`]: { "$exists": true }
                        },
                        {
                            privacy: "public"
                        }
                    ]
                }, searchObject),
                (err, count) => {
                    if (err) res.status(500).send();
                    else {
                        fileCollection.find(Object.assign({}, {
                            "$or": [
                                {
                                    user: req.user._id
                                },
                                {
                                    privacy: "private",
                                    [`trustedUsers.${req.user._id}`]: { "$exists": true }
                                },
                                {
                                    privacy: "public"
                                }
                            ]
                        }, searchObject),
                        {
                            limit: Number(process.env.PAGE_SIZE),
                            sort: { _id: 1},
                            skip: Number(process.env.PAGE_SIZE) * Number(req.params.pageNum)
                        }).toArray((err, docs) => {
                                if (err || docs === null) res.status(500).send()
                                else {
                                    res.json({
                                        files: docs,
                                        totalFiles: count
                                    })
                                }
                        });
                    }
                })
            }
            else {
                fileCollection.count(Object.assign({}, {
                    privacy: "public"
                }, searchObject),
                (err, count) => {
                    if (err) res.status(500).send();
                    else {
                        fileCollection.find(Object.assign({}, {
                                privacy: "public"
                            }, searchObject),
                        {
                            limit: Number(process.env.PAGE_SIZE),
                            sort: { _id: 1},
                            skip: Number(process.env.PAGE_SIZE) * Number(req.params.pageNum)
                        }).toArray((err, docs) => {
                                if (err || docs === null) res.status(500).send()
                                else {
                                    res.json({
                                        files: docs,
                                        totalFiles: count
                                    })
                                }
                        });
                    }
                })
            }
        }
    );

    //API for retrieving a single file
    app.post(process.env.RETRIEVE_FILE_PATH,
        function(req, res) {
            let userId;
            try {
                userId = req.user._id;
            }
            catch {
                userId = MongoDB.ObjectId();
            }
            
            fileCollection.findOne({
                _id: MongoDB.ObjectId(req.body.fileId)
            },
            function(err, doc) {
                if (err || doc === null) {
                    res.status(500).json({
                        errorMessage: "Unable to retrieve file"
                    });
                }
                else if (!(doc.privacy === "public" || (userId.equals(doc.user))
                || (doc.privacy === "private" && doc.trustedUsers[userId.toString()] !== undefined)
                || (doc.privacy === "shared" && req.body.token === doc.token.toString()))){
                    res.status(500).json({
                        errorMessage: "Invalid permissions to retrieve file"
                    });
                }
                else {
                    const cursor = fileBucket.find({ _id: MongoDB.ObjectId(req.body.fileId) });
                    cursor.next((err, doc) => {
                        if (err || !doc) {
                            res.status(500).json({
                                errorMessage: "Failure in sending file"
                            });
                        }
                        else {
                            res.setHeader("Content-Type", doc.metadata.mimetype);
                            res.setHeader("Content-Length", doc.length);
                            fileBucket.openDownloadStream(MongoDB.ObjectId(req.body.fileId))
                                .pipe(res);
                        }
                    })
                }
            });
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
    app.post(process.env.RETRIEVE_METADATA_PATH,
        function(req, res) {
            let userId;
            try {
                userId = req.user._id;
            }
            catch {
                userId = MongoDB.ObjectId();
            }
            
            fileCollection.findOne({
                    _id: MongoDB.ObjectId(req.body.fileId)
                },
                function(err, doc) {
                    if (err || doc === null) res.status(500).send();
                    else {
                        res.json({
                            userId: doc.user,
                            fileId: doc._id,
                            filename: doc.filename,
                            privacy: doc.privacy,
                            trustedUsers: doc.trustedUsers,
                            size: doc.size,
                            mimetype: doc.mimetype,
                            isUsers: doc.user.toString() === userId.toString(),
                            comment: doc.comment,
                            token: doc.token.toString(),
                            isAccessible: (doc.privacy === "public" || userId.equals(doc.user)
                                || (doc.privacy === "private" && doc.trustedUsers[userId.toString()] !== undefined)
                                || (doc.privacy === "shared" && req.body.token === doc.token.toString()))
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
                    user: req.user._id
                },
                { "$set": {
                    comment: req.body.comment,
                    trustedUsers: req.body.trustedUsers,
                    privacy: req.body.privacy
                }},
                function(err, doc) {
                    if (err || doc.value === null) {
                        res.status(500).json({
                            errorMessage: "Unable to update file's metadata"
                        });
                    }
                    else {
                        res.status(204).send();
                    };
                }
            );
        }
    );

    //API for updating a file's token
    app.put(process.env.UPDATE_TOKEN_PATH,
        ensureAuthenticated(),
        function(req, res) {
            fileCollection.findOneAndUpdate({
                    _id: MongoDB.ObjectId(req.body.fileId),
                    user: req.user._id
                },
                { "$set": { token: crypto.randomBytes(24).toString("base64url") }},
                function(err, doc) {
                    if (err || doc.value === null) res.status(500).send();
                    else {
                        res.status(204).send();
                    } 
                }
            )
        }
    );
}

module.exports = main