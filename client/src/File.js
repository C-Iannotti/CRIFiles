import React from "react";
import "./style.css";
import { withWrapper } from "./componentWrapper";
import $ from "jquery";
import {
    getSearchedUsersPage,
    getFileMetadata,
    deleteFile,
    getTrustedUsersPage,
    createNewToken,
    retrieveFile,
    updateFile
} from "./utils.js"
import Loading from "./Loading.js"

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;
const APP_URL = (process.env.REACT_APP_DEPLOYMENT === "development"
    ? process.env.REACT_APP_DEV_URL : SERVER_URL);
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

/* A React component for displaying information
    and interactions for a file
*/
class File extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            usersInput: "",
            tag: null
        };

        this.getSearchedUsersPage = getSearchedUsersPage.bind(this);
        this.getFileMetadata = getFileMetadata.bind(this);
        this.deleteFile = deleteFile.bind(this);
        this.createNewToken = createNewToken.bind(this);
        this.getTrustedUsersPage = getTrustedUsersPage.bind(this);
        this.retrieveFile = retrieveFile.bind(this);
        this.updateFile = updateFile.bind(this);
        this.getFileContainerHTML = this.getFileContainerHTML.bind(this);
        this.toggleTrustedUsersContainer = this.toggleTrustedUsersContainer.bind(this);
        this.handleTrustedUserDisplay = this.handleTrustedUserDisplay.bind(this);
        this.handleUserSearch = this.handleUserSearch.bind(this);
        this.displayFile = this.displayFile.bind(this);
        this.handleDownload = this.handleDownload.bind(this);
        this.checkFile = this.checkFile.bind(this);
        this.updateFileMetadata = this.updateFileMetadata.bind(this);
        this.getShareableUrlHTML = this.getShareableUrlHTML.bind(this);
    }

    componentDidMount() {
        this.checkFile();
        window.addEventListener("click", this.toggleTrustedUsersContainer);
    }

    componentWillUnmount() {
        window.removeEventListener("click", this.toggleTrustedUsersContainer);
    }

    checkFile() {
        this.getFileMetadata(this.props.params.fileId, this.props.params.token, (err, res) => {
            if (err || !res.data.isAccessible) {
                this.props.database(db => {
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
            else {
                if (res.data.size <= process.env.REACT_APP_MAX_FILE_SIZE) {
                    this.retrieveFile(this.props.database, this.props.params.fileId, this.props.params.token, (err, res, db) => {
                        if (err) this.props.addMessage(res.data.errorMessage || "Server error");
                        else {
                            if (db) {
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
                                    blob: res
                                });
                                req2.onsuccess = event => {
                                    console.log("Added item: " + event.target.result);
                                };
                                req2.onerror = event => {
                                    console.error("Unable to locally store file: " + event.target.errorCode);
                                };
                            }
                            this.displayFile(res);
                            this.setState({ pageLoaded: true, fileDownloadProgress: undefined}, () => {
                                this.handleTrustedUserDisplay();
                            });
                        };
                    });
                }
                else {
                    this.setState({
                        pageLoaded: true,
                        tag: <pre id="file-display" className="no-file-display">Unable to display file</pre>
                    }, this.handleTrustedUserDisplay);
                }
            }
        })
    }

    updateFileMetadata() {
        let comment = document.getElementById("comment-input").value;
        let privacy = document.getElementById("privacy-input").value;
        
        this.updateFile(this.props.params.fileId, this.state.trustedUsers || {}, comment, privacy, (err, res) => {
            if (err) this.props.addMessage(res.data.errorMessage || "Server error");
            else {
                this.getFileMetadata(this.props.params.fileId, this.props.params.token, (err, res) => {
                    if (err) {
                        console.error(err);
                        this.props.addMessage(res.data.errorMessage || "Server error");
                        this.props.navigate(-1);
                    }
                    else {
                        this.props.addMessage("Updated file!");
                        this.handleTrustedUserDisplay(this.state.trustedUsersPage);
                        this.setState({ editFile: false});
                    }
                });
            }
        });
    }

    handleUserSearch(userString, page) {
        document.getElementById("previous-searched-users-button").setAttribute("disabled", "true")
        document.getElementById("next-searched-users-button").setAttribute("disabled", "true")
        this.getSearchedUsersPage(userString, page, (err, res) => {
            if (err) {
                console.error(err);
                this.props.addMessage(res && res.data.errorMessage ? res.data.errorMessage : "Server error");
            }
            
            document.getElementById("previous-searched-users-button").removeAttribute("disabled");
            document.getElementById("next-searched-users-button").removeAttribute("disabled");
        });
    }

    handleTrustedUserDisplay(page) {
        page = page || 1;
        document.getElementById("previous-trusted-users-button").setAttribute("disabled", "true")
        document.getElementById("next-trusted-users-button").setAttribute("disabled", "true")
        this.getTrustedUsersPage(page, () => {
            document.getElementById("previous-trusted-users-button").removeAttribute("disabled")
            document.getElementById("next-trusted-users-button").removeAttribute("disabled")
        })
    }

    toggleTrustedUsersContainer(e) {
        if (e.target.matches(".trusted-users-input") || 
            e.target.matches(".user-item-display") ||
            e.target.matches(".user-item-displayname") ||
            e.target.matches(".user-item-id") ||
            (document.getElementById("users-display-container") &&
            document.getElementById("users-display-container").contains(e.target))
            ) {
            this.setState({ toggleTrustedUsers: true});
        }
        else {
            this.setState({ toggleTrustedUsers: false});
        }
    }

    handleDownload() {
        document.getElementById("download-button").setAttribute("disabled", "true");
        this.props.addMessage("Retrieving file...");
        this.retrieveFile(this.props.database, this.props.params.fileId, this.props.params.token, (err, res) => {
            if (err) console.error(err);
            else {
                let a = $("<a style='display: none;'/>");
                let url = window.URL.createObjectURL(res);
                a.attr("href", url);
                a.attr("download", this.state.filename);
                $("body").append(a);
                a[0].click();
                window.URL.revokeObjectURL(url);
                a.remove();
                this.setState({
                    fileDownloadProgress: undefined
                }, () => document.getElementById("download-button").removeAttribute("disabled"));
            }
        })
    }

    displayFile(blob) {
        let url = window.URL.createObjectURL(blob);
        let supportedFiles = JSON.parse(process.env.REACT_APP_SUPPORTED_FILES); 
        let fileSupport = supportedFiles[this.state.mimetype.split('/', 1)[0]];

        if (fileSupport && (
                !Array.isArray(fileSupport["types"]) ||
                fileSupport["types"].length === 0 ||
                fileSupport["types"].includes(this.state.mimetype.split('/', 2)[1])
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
                this.setState({ tag: <audio id="file-display" className="audio-display" controls><source src={url} type={this.state.mimetype}></source></audio> });
            }
            else if (fileSupport["tag"] === "video") {
                this.setState({ tag: <video id="file-display" className="video-display" controls><source src={url} type={this.state.mimetype}></source></video> });
            }
            else if (fileSupport["tag"] === "img") {
                this.setState({ tag: <img id="file-display" className="img-display" src={url} alt={this.state.filename + " display"} /> });
            }
            else {
                this.setState({ tag: <pre id="file-display" className="no-file-display">Unable to display file</pre>});
            }
        }
        else {
            this.setState({ tag: <pre id="file-display" className="no-file-display">Unable to display file</pre> });
        }
    }

    getFileContainerHTML() {
        return (
            <div id="file-container" className="file-container">
                <div id="file-container-sidebar-parent" className="file-container-sidebar-parent">
                    {this.state.isUsers &&
                    <div id="file-container-sidebar" className="file-container-sidebar">
                        {this.state.editFile &&
                            <button type="button"
                                id="cancel-button"
                                className="cancel-button"
                                onClick={() => {
                                    this.setState({
                                        editFile: false
                                    })
                                }}
                                >Cancel</button>
                        }
                        {this.state.editFile &&
                            <button type="button"
                                id="metadata-update-button"
                                className="metadata-update-button"
                                onClick={() => this.updateFileMetadata()}
                                >Update</button>
                        }
                        {!this.state.editFile &&
                            <button type="button"
                                id="edit-button"
                                className="edit-button"
                                onClick={() => {
                                    this.setState({
                                        editFile: true,
                                        commentInput: this.state.comment
                                    })
                                }}
                                >Edit</button>
                        }
                    </div>}
                </div>
                <div className="file-container-header">
                    <p className="fileid-display">{"File ID: " + this.props.params.fileId}</p>
                    {this.state.editFile ?
                        <select id="privacy-input"
                                className="privacy-input-file"
                                name="privacy"
                                defaultValue={this.state.privacy}
                                key={this.state.privacy + "-update-form"}>
                            <option value="private">Private</option>
                            <option value="shared">Shared</option>
                            <option value="public">Public</option>
                        </select>
                        :
                        <p className="privacy-display">{this.state.privacy}</p>
                    }
                </div>
                {this.state.editFile && 
                    <input type="text"
                            id="trusted-users-input"
                            className="trusted-users-input"
                            name="trustedUsers"
                            value={this.state.toggleTrustedUsers ? this.state.usersInput : `Trusted Users (${Object.keys(this.state.trustedUsers || {}).length} of ${process.env.REACT_APP_MAX_TRUSTED_USERS})`}
                            onChange={e => this.handleUserSearch(e.target.value, 1)}
                            maxLength="24"
                    />}
                <div className="users-display-container-parent">
                    <div className={this.state.toggleTrustedUsers ? "users-display-container" : "users-display-container-none"}
                        id="users-display-container">
                        <div className="users-display-controls">
                            <div className="users-display-buttons">
                                <button type="button"
                                        id="previous-searched-users-button"
                                        className="page-button"
                                        onClick={() => this.handleUserSearch(this.state.usersInput, this.state.searchedUsersPage-1)}
                                        >&#706;</button>
                                <button type="button"
                                        id="next-searched-users-button"
                                        className="page-button"
                                        onClick={() => this.handleUserSearch(this.state.usersInput, this.state.searchedUsersPage+1)}
                                        >&#707;</button>
                            </div>
                            <div className="users-display-buttons">
                                <button type="button"
                                        id="previous-trusted-users-button"
                                        className="page-button"
                                        onClick={() => this.handleTrustedUserDisplay(this.state.trustedUsersPage-1)}
                                        >&#706;</button>
                                <button type="button"
                                        id="next-trusted-users-button"
                                        className="page-button"
                                        onClick={() => this.handleTrustedUserDisplay(this.state.trustedUsersPage+1)}
                                        >&#707;</button>
                            </div>
                        </div>
                        <div className="users-display">
                            <div className="searched-users-display">
                                {this.state.loadingSearchedUsers ? 
                                <div className="dot-flashing dot-flashing-data"></div>
                                :
                                (this.state.searchedUsers || []).map(user => {
                                    return (
                                        <div key={user._id + "_searched"} className="user-item-display" onClick={() => {
                                            if (Object.keys(this.state.trustedUsers || {}).length < Number(process.env.REACT_APP_MAX_TRUSTED_USERS)) {
                                                let trustedUsers = this.state.trustedUsers || {};
                                                trustedUsers[user._id] = user;
                                                this.setState({ trustedUsers: trustedUsers }, () => {
                                                    this.handleTrustedUserDisplay(this.state.trustedUsersPage);
                                                });
                                            }
                                        }}>
                                            <p id="user-item-displayname" className="user-item-displayname">{user.displayname}</p>
                                            <p className="user-item-id">{user._id}</p>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="trusted-users-display">
                                {Object.values(this.state.trustedUsersView || {}).map(user => {
                                    return (
                                        <div key={user._id + "_trusted"} className="user-item-display" onClick={() => {
                                            let trustedUsers = this.state.trustedUsers;
                                            delete trustedUsers[user._id];
                                            this.setState({ trustedUsers: trustedUsers }, () => {
                                                this.handleTrustedUserDisplay(this.state.trustedUsersPage);
                                            });
                                        }}>
                                            <p id="user-item-displayname" className="user-item-displayname">{user.displayname}</p>
                                            <p className="user-item-id">{user._id}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div id="file-display-holder" className="file-display-holder">{this.state.tag}</div>
                {this.state.editFile ?
                    <textarea id="comment-input"
                        className="comment-input"
                        name="comment"
                        maxLength="500"
                        value={this.state.commentInput || ""}
                        onChange={e => this.setState({ commentInput: e.target.value })}
                        ></textarea>
                    :
                    <textarea id="comment-input"
                        className="comment-input"
                        name="comment"
                        maxLength="500"
                        value={this.state.comment}
                        readOnly
                        ></textarea>
                }
                <div className="file-container-buttons">
                    <button type="button"
                            id="download-button"
                            className="download-button"
                            onClick={() => this.handleDownload()}>{this.state.fileDownloadProgress ? `Downloading ${this.state.fileDownloadProgress}%`: "Download File"}</button>
                    <button type="button" id="delete-button" className="delete-button" onClick={() => {
                        this.props.addMessage("Deleting file...");
                        this.deleteFile(this.props.params.fileId, (err, res) => {
                        if (err) {
                            console.error(err);
                            this.props.addMessage(res.data.errorMessage || "Server error");
                        }
                        else {
                            this.props.addMessage("Deleted file!");
                            this.props.navigate(-1);
                        }
                    })}}>Delete File</button>
                </div>
                {this.state.isUsers && this.getShareableUrlHTML()}
            </div>
        )
    }

    getShareableUrlHTML() {
        return (
            <div id="shareable-url-container" className="shareable-url-container">
                <input type="text"
                    id="shareable-url"
                    className="shareable-url"
                    defaultValue={APP_URL + "/file" 
                            + "/" + this.props.params.fileId
                            + "/" + this.state.token}
                    key={this.state.token}
                    readOnly
                />
                <button type="button"
                        id="token-update-button"
                        className="token-update-button"
                        onClick={() => this.createNewToken(this.props.params.fileId, (err, res) => {
                            if (err) {
                                console.error(err);
                                this.props.addMessage(res.data.errorMessage || "Server error");
                            }
                            else {
                                this.getFileMetadata(this.props.params.fileId, this.props.params.token, (err, res) => {
                                    if (err) {
                                        console.error(err);
                                        this.props.addMessage(res.data.errorMessage || "Server error");
                                    }
                                    else {
                                        this.props.addMessage("Created new URL");
                                        this.handleTrustedUserDisplay(this.state.trustedUsersPage);
                                    }
                                })
                            }
                        })}
                        >New Url</button>
            </div>
        )
    }

    render() {
        if (!this.state.pageLoaded) return <Loading loadingMessage="Retrieving File"/>
        else {
            return(
                <div className="file-page">
                    {this.getFileContainerHTML()}
                </div>
            )
        }
    }
}

export default withWrapper(File)