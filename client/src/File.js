import React from "react";
import axios from "axios";
import "./style.css";
import { withWrapper } from "./comonentWrapper";
import $ from "jquery";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

class File extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            metadata: null,
            searchedUsers: [],
            usersPage: 1,
            usersController: null,
            usersInput: "",
            tag: null
        };

        this.displayFile = this.displayFile.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.retrieveFile = this.retrieveFile.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
        this.checkFile = this.checkFile.bind(this);
        this.updateFileMetadata = this.updateFileMetadata.bind(this);
        this.getUserFormHTML = this.getUpdateFormHTML.bind(this);
        this.getFileMetadata = this.getFileMetadata.bind(this);
    }

    componentDidMount() {
        this.checkFile();
    }

    getFileMetadata(userFunction=(() => { return })) {
        axios({
            method: "get",
            url: SERVER_URL
                 + process.env.REACT_APP_RETRIEVE_METADATA_PATH
                 + "/"
                 + this.props.params.fileId,
            withCredentials: true
            })
            .then(res => {
                res.data.trustedUsers = JSON.parse(res.data.trustedUsers)
                this.setState({ metadata: res.data});
                userFunction(res);
            });
    }

    checkFile() {
        this.getFileMetadata(res => {
            if (res.status === 500) {
                this.props.useDatabase(db => {
                    let request = db.transaction([DB_STORE_NAME], "readwrite")
                                    .objectStore(DB_STORE_NAME)
                                    .delete(this.props.params.fileId);
                    request.onerror = event => {
                        console.error("Unable to delete local file: " + event.target.errorCode);
                    }
                    request.onsuccess = event => {
                        console.log("Successfully deleted local file: " + event.target.result);
                    }
                });
                this.props.navigate(-1);
            }
            else if (res.data.size <= process.env.REACT_APP_MAX_FILE_SIZE) {
                this.retrieveFile(this.displayFile);
            }
        })
    }

    retrieveFile(userFunction) {
        this.props.useDatabase(db => {
            let objectStore = db.transaction(DB_STORE_NAME).objectStore(DB_STORE_NAME);

            let req1 = objectStore.openCursor(this.props.params.fileId);
            req1.onerror = event => {
                console.error("Unable to check database for file: " + event.target.errorcode);
            }
            req1.onsuccess = event => {
                let cursor = event.target.result;
                if (!cursor) {
                    axios({
                        method: "get",
                        url: SERVER_URL
                             + process.env.REACT_APP_RETRIEVE_FILE_PATH
                             + "/"
                             + this.props.params.fileId,
                        withCredentials: true,
                        responseType: "blob"
                        })
                        .then(res => {
                            let transaction = db.transaction([DB_STORE_NAME], "readwrite");
                            transaction.oncomplete = event => {
                                console.log("Completed adding to database: " + event.target.result);
                                db.close();
                            }
                            transaction.onerror = event => {
                                console.error("Unable to locally store file: " + event.target.errorCode);
                                db.close();
                            };

                            let req2 = transaction.objectStore(DB_STORE_NAME).add({
                                fileId: this.props.params.fileId,
                                blob: res.data
                            });
                            req2.onsuccess = event => {
                                console.log("Added item: " + event.target.result);
                            };
                            req2.onerror = event => {
                                console.error("Unable to locally store file: " + event.target.errorCode);
                            };

                            userFunction(res.data);
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
                else {
                    console.log("Found local file");
                    userFunction(cursor.value.blob);
                }
            }
        });
    }

    downloadFile(blob) {
        let a = $("<a style='display: none;'/>");
        let url = window.URL.createObjectURL(blob);
        a.attr("href", url);
        a.attr("download", this.state.metadata.filename);
        $("body").append(a);
        a[0].click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    displayFile(blob) {
        let url = window.URL.createObjectURL(blob);
        let supportedFiles = JSON.parse(process.env.REACT_APP_SUPPORTED_FILES); 
        let fileSupport = supportedFiles[this.state.metadata.mimetype.split('/', 1)[0]];

        if (fileSupport && (
                !Array.isArray(fileSupport["types"]) ||
                fileSupport["types"].length === 0 ||
                fileSupport["types"].includes(this.state.metadata.mimetype.split('/', 2)[1])
                )
            ) {
            if (fileSupport["tag"] === "iframe") {
                this.setState({ tag: <iframe id="file-display" className="iframe-display" src={url} allow="fullscreen" title={this.props.params.fileId + " display"}></iframe> });
            }
            else if (fileSupport["tag"] === "pre") {
                blob.text().then(res => {
                    this.setState({ tag: <pre id="file-display" className="pre-display">{res}</pre> }); 
                    }
                );
            }
            else if (fileSupport["tag"] === "audio") {
                this.setState({ tag: <audio id="file-display" className="audio-display" controls><source src={url} type={this.state.metadata.mimetype}></source></audio> });
            }
            else if (fileSupport["tag"] === "video") {
                this.setState({ tag: <video id="file-display" className="video-display" controls><source src={url} type={this.state.metadata.mimetype}></source></video> });
            }
            else if (fileSupport["tag"] === "img") {
                this.setState({ tag: <img id="file-display" className="img-display" src={url} alt={this.state.metadata.filename + " display"} /> });
            }
        }
    }

    deleteFile() {
        axios({
            method: "delete",
            url: SERVER_URL
                 + process.env.REACT_APP_DELETE_FILE_PATH
                 + "/"
                 + this.props.params.fileId,
            withCredentials: true
            })
            .then(res => {
                if (res.status === 204) this.props.navigate(-1);
                else {
                    console.log("Unable to delete file")
                }
            });
    }

    updateFileMetadata() {
        let comment = document.getElementById("comment-input").value;
        let privacy = document.getElementById("privacy-input").value;

        axios({
            method: "put",
            url: SERVER_URL + process.env.REACT_APP_UPDATE_METADATA_PATH,
            data: {
                fileId: this.props.params.fileId,
                trustedUsers: JSON.stringify(this.state.metadata.trustedUsers),
                comment: comment,
                privacy: privacy
            },
            withCredentials: true
            })
            .then(res => {
                if (res.status >= 400) {
                    this.setState({ errorMessage: "Unable to update file's metadata" })
                }
                else {
                    this.getFileMetadata();
                }
            });
    }

    getUsersPage(userString, pageNumber) {
        return() => {
            if (this.state.usersController !== null) this.state.usersController.abort();
            this.setState({
                searchedUsers: [],
                usersController: new AbortController(),
                usersInput: userString,
                usersPage: pageNumber
            }, err => {
                if (err) console.error(err)
                if (userString && pageNumber >= 1) {
                    axios({
                            method: "get",
                            url: SERVER_URL + process.env.REACT_APP_RETRIEVE_USERS_PATH
                                + "/" + this.state.usersInput + "/" + String(this.state.usersPage - 1),
                            withCredentials: true,
                            signal: this.state.usersController.signal
                        })
                        .then(res => {
                            this.setState({
                                searchedUsers: res.data.users,
                                usersController: null
                            })
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            })
        }
    }

    getUpdateFormHTML() {
        let userForm = "";
        if (this.state.metadata && this.state.metadata.isUsers) {
            userForm = 
            <form id="metadata-update-form" className="metadata-update-form">
                <select id="privacy-input"
                        className="privacy-input"
                        name="privacy"
                        defaultValue={this.state.metadata.privacy}
                        key={this.state.metadata.privacy + "-update-form"}>
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                </select>
                <input type="text"
                       id="trusted-users-input"
                       className="trusted-users-input"
                       name="trustedUsers"
                       value={this.state.usersInput}
                       onChange={e => {this.getUsersPage(e.target.value, this.state.usersPage)()}}
                       maxLength="500"
                />
                <div className="users-display">
                    <div className="searched-users-display">
                        {this.state.searchedUsers.map(user => {
                            return (
                                <div key={user._id + "_searched"} className="user-item-display" onClick={() => {
                                    let trustedUsers = this.state.metadata.trustedUsers;
                                    trustedUsers[user._id] = user;
                                    this.setState({ trustedUsers: trustedUsers });
                                }}>
                                    {user.displayname + ": " + user._id}
                                </div>
                            )
                        })}
                    </div>
                    <div className="trusted-users-display">
                        {Object.values(this.state.metadata.trustedUsers).map(user => {
                            return (
                                <div key={user._id + "_trusted"} className="user-item-display" onClick={() => {
                                    let trustedUsers = this.state.metadata.trustedUsers;
                                    delete trustedUsers[user._id];
                                    this.setState({ trustedUsers: trustedUsers });
                                }}>
                                    {user.displayname + ": " + user._id}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <input type="text" id="comment-input" className="comment-input" defaultValue={this.state.metadata.comment} maxLength="500" />
                <input type="reset" id="metadata-reset-button" className="metadata-reset-button" value="Reset" />
                <button type="button" id="metadata-update-button" className="metadata-update-button" onClick={this.updateFileMetadata}>Update</button>
            </form>;
        }
        return userForm
    }

    render() {
        return(
            <div>
                <p>File Page</p>
                <p><strong>{this.props.params.fileId}</strong></p>
                <div id="file-display-holder">{this.state.tag}</div>
                <button type="button" id="download-button" className="download-button" onClick={() => this.retrieveFile(this.downloadFile)}>Download File</button>
                <button type="button" id="delete-button" className="delete-button" onClick={this.deleteFile}>Delete File</button>
                <button type="button" id="display-button" className="display-button" onClick={() => this.retrieveFile(this.displayFile)}>Display File</button>
                <br />
                {this.state.errorMessage !== null && <p id="update-form-error" className="error-message">{this.state.errorMessage}</p>}
                {this.getUpdateFormHTML()}
            </div>
        )
    }
}

export default withWrapper(File)