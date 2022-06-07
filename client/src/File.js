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
        this.state = { metadata: null };

        this.displayFile = this.displayFile.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.retrieveFile = this.retrieveFile.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
        this.checkFile = this.checkFile.bind(this);
        this.updateFileMetadata = this.updateFileMetadata.bind(this);

        this.checkFile();
    }

    checkFile() {
        axios({
            method: "get",
            url: SERVER_URL
                 + process.env.REACT_APP_RETRIEVE_METADATA_PATH
                 + "/"
                 + this.props.params.fileId,
            withCredentials: true
            })
            .then(res => {
                this.setState({ metadata: res.data});

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
            });
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
                                filename: res.headers["filename"],
                                mimetype: res.headers["content-type"],
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
        a.attr("download", this.props.params.fileId);
        $("body").append(a);
        a[0].click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    displayFile(blob) {
        let url = window.URL.createObjectURL(blob);
        let supportedFiles = JSON.parse(process.env.REACT_APP_SUPPORTED_FILES); 
        let fileSupport = supportedFiles[this.state.metadata.mimetype.split('/', 1)[0]];
        let tag = "";

        if (fileSupport && (
                fileSupport["types"] === [] ||
                fileSupport["types"].includes(this.state.metadata.mimetype.split('/', 2)[1])
                )
            ) {
            if (fileSupport["tag"] === "iframe") {
                tag = `<iframe id="file-display" className="iframe-display" src=${url} allowFullScreen="true"></iframe>`;
            }
            else if (fileSupport["tag"] === "pre") {
                tag = `<pre id="file-display" className="pre-display">${blob.text()}</pre>`;
            }
            else if (fileSupport["tag"] === "audio") {
                tag = `<audio id="file-display" className="audio-display" controls><source src=${url} type=${this.state.metadata.mimetype}></source></audio>`;
            }
            else if (fileSupport["tag"] === "video") {
                tag = `<video id="file-display" className="video-display" controls><source src=${url} type=${this.state.metadata.mimetype}></source></video>`;
            }
            else if (fileSupport["tag"] === "img") {
                tag = `<img id="file-display" className="img-display" src=${url} alt=${this.state.metadata.filename + " display"} />`;
            }
        }
        $("#file-display-holder").html(tag);
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
        let trustedUsers = document.getElementById("trusted-users-input").value;
        let comment = document.getElementById("comment-input").value;
        let privacy = document.getElementById("privacy-input").value;
        console.log()
        axios({
            method: "put",
            url: SERVER_URL + process.env.REACT_APP_UPDATE_METADATA_PATH,
            data: {
                fileId: this.props.params.fileId,
                trustedUsers: trustedUsers,
                comment: comment,
                privacy: privacy
            },
            withCredentials: true
            })
            .then(res => {
                console.log(res)
                if (res.status === 204) this.forceUpdate();
            });
    }

    render() {
        let userForm = "";
        if (this.state.metadata && this.state.metadata.isUsers) {
            userForm = 
            <form id="metadata-update-form" className="metadata-update-form">
                <select id="privacy-input" className="privacy-input" name="privacy" defaultValue={this.state.metadata.privacy}>
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                </select>
                <input type="text" id="trusted-users-input" className="trusted-users-input" defaultValue={this.state.metadata.acceptedUsers} maxLength="500" />
                <input type="text" id="comment-input" className="comment-input" defaultValue={this.state.metadata.comment} maxLength="500" />
                <input type="reset" id="metadata-reset-button" className="metadata-reset-button" value="Reset" />
                <button type="button" id="metadata-update-button" className="metadata-update-button" onClick={this.updateFileMetadata}>Update</button>
            </form>;
        }
        return(
            <div>
                <p>File Page</p>
                <p><strong>{this.props.params.fileId}</strong></p>
                <div id="file-display-holder"></div>
                <button type="button" id="download-button" className="download-button" onClick={() => this.retrieveFile(this.downloadFile)}>Download File</button>
                <button type="button" id="delete-button" className="delete-button" onClick={this.deleteFile}>Delete File</button>
                <button type="button" id="display-button" className="display-button" onClick={() => this.retrieveFile(this.displayFile)}>Display File</button>
                <br />
                {userForm}
            </div>
        )
    }
}

export default withWrapper(File)