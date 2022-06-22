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

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;
const APP_URL = (process.env.REACT_APP_DEPLOYMENT === "development"
    ? process.env.REACT_APP_DEV_URL : SERVER_URL);
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

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
        this.displayFile = this.displayFile.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.checkFile = this.checkFile.bind(this);
        this.updateFileMetadata = this.updateFileMetadata.bind(this);
        this.getUserFormHTML = this.getUpdateFormHTML.bind(this);
        this.getShareableUrlHTML = this.getShareableUrlHTML.bind(this);
    }

    componentDidMount() {
        this.checkFile();
    }

    checkFile() {
        this.getFileMetadata(this.props.params.fileId, this.props.params.token, (err, res) => {
            console.log("here")
            if (err || !res.data.isAccessible) {
                console.log("Here")
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
            else {
                if (res.data.size <= process.env.REACT_APP_MAX_FILE_SIZE) {
                    this.retrieveFile(this.props.useDatabase, (err, res) => {
                        if (err) this.setState({ errorMessage: res.data.errorMessage })
                        else {
                            console.log(res)
                            this.displayFile(res)
                        };
                    });
                }
                this.getTrustedUsersPage(1);
            }
        })
    }

    updateFileMetadata() {
        let comment = document.getElementById("comment-input").value;
        let privacy = document.getElementById("privacy-input").value;
        
        this.updateFile(this.props.params.fileId, this.state.trustedUsers || {}, comment, privacy, (err, res) => {
            if (err) console.error(err)//this.setState({ errorMessage: res.data.errorMessage});
            else {
                this.getFileMetadata(this.props.params.fileId, this.props.params.token)
            }
        });
    }

    downloadFile(blob) {
        let a = $("<a style='display: none;'/>");
        let url = window.URL.createObjectURL(blob);
        a.attr("href", url);
        a.attr("download", this.state.filename);
        $("body").append(a);
        a[0].click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    displayFile(blob) {
        let url = window.URL.createObjectURL(blob);
        let supportedFiles = JSON.parse(process.env.REACT_APP_SUPPORTED_FILES); 
        let fileSupport = supportedFiles[this.state.mimetype.split('/', 1)[0]];
        console.log(this.state.mimetype)

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
        }
    }

    getUpdateFormHTML() {
        return(
            <form id="metadata-update-form" className="metadata-update-form">
                <select id="privacy-input"
                        className="privacy-input"
                        name="privacy"
                        defaultValue={this.state.privacy}
                        key={this.state.privacy + "-update-form"}>
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                </select>
                <input type="text"
                       id="trusted-users-input"
                       className="trusted-users-input"
                       name="trustedUsers"
                       value={this.state.usersInput}
                       onChange={e => {this.getSearchedUsersPage(e.target.value, 1)}}
                       maxLength="500"
                />
                <div className="users-display">
                    <div className="searched-users-display">
                        <button type="button"
                                id="previous-searched-users-button"
                                className="page-button"
                                onClick={() => {
                                        document.getElementById("previous-searched-users-button").setAttribute("disabled", "true")
                                        document.getElementById("next-searched-users-button").setAttribute("disabled", "true")
                                        this.getSearchedUsersPage(this.state.usersInput, this.state.searchedUsersPage-1, () => {
                                            document.getElementById("previous-searched-users-button").removeAttribute("disabled")
                                            document.getElementById("next-searched-users-button").removeAttribute("disabled")
                                        })
                                    }
                                }
                                >Previous</button>
                        <button type="button"
                                id="next-searched-users-button"
                                className="page-button"
                                onClick={() => {
                                        document.getElementById("previous-searched-users-button").setAttribute("disabled", "true")
                                        document.getElementById("next-searched-users-button").setAttribute("disabled", "true")
                                        this.getSearchedUsersPage(this.state.usersInput, this.state.searchedUsersPage+1, () => {
                                            document.getElementById("previous-searched-users-button").removeAttribute("disabled")
                                            document.getElementById("next-searched-users-button").removeAttribute("disabled")
                                        })
                                    }
                                }
                                >Next</button>
                        {(this.state.searchedUsers || []).map(user => {
                            return (
                                <div key={user._id + "_searched"} className="user-item-display" onClick={() => {
                                    let trustedUsers = this.state.trustedUsers;
                                    trustedUsers[user._id] = user;
                                    this.setState({ trustedUsers: trustedUsers });
                                    this.getTrustedUsersPage(this.state.trustedUsersPage || 1);
                                }}>
                                    {user.displayname + ": " + user._id}
                                </div>
                            )
                        })}
                    </div>
                    <div className="trusted-users-display">
                        <button type="button"
                                id="previous-trusted-users-button"
                                className="page-button"
                                onClick={() => {
                                        document.getElementById("previous-trusted-users-button").setAttribute("disabled", "true")
                                        document.getElementById("next-trusted-users-button").setAttribute("disabled", "true")
                                        this.getTrustedUsersPage(this.state.trustedUsersPage-1, () => {
                                            document.getElementById("previous-trusted-users-button").removeAttribute("disabled")
                                            document.getElementById("next-trusted-users-button").removeAttribute("disabled")
                                        })
                                    }
                                }
                                >Previous</button>
                        <button type="button"
                                id="next-trusted-users-button"
                                className="page-button"
                                onClick={() => {
                                    document.getElementById("previous-trusted-users-button").setAttribute("disabled", "true")
                                    document.getElementById("next-trusted-users-button").setAttribute("disabled", "true")
                                    this.getTrustedUsersPage(this.state.trustedUsersPage+1, () => {
                                        document.getElementById("previous-trusted-users-button").removeAttribute("disabled")
                                        document.getElementById("next-trusted-users-button").removeAttribute("disabled")
                                    })
                                }
                            }
                                >Next</button>
                        {Object.values(this.state.trustedUsersView || {}).map(user => {
                            return (
                                <div key={user._id + "_trusted"} className="user-item-display" onClick={() => {
                                    let trustedUsers = this.state.trustedUsers;
                                    delete trustedUsers[user._id];
                                    this.setState({ trustedUsers: trustedUsers });
                                    this.getTrustedUsersPage(this.state.trustedUsersPage || 1);
                                }}>
                                    {user.displayname + ": " + user._id}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <input type="text" id="comment-input" className="comment-input" defaultValue={this.state.comment} maxLength="500" />
                <input type="reset" id="metadata-reset-button" className="metadata-reset-button" value="Reset" onClick={() => this.getFileMetadata(this.props.params.fileId, undefined, () => this.getTrustedUsersPage(this.state.trustedUsersPage))}/>
                <button type="button" id="metadata-update-button" className="metadata-update-button" onClick={this.updateFileMetadata}>Update</button>
            </form>
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
                        onClick={() => this.createNewToken(this.props.params.fileId, () => this.getFileMetadata(this.props.params.fileId, this.props.params.token))}
                        readOnly
                        >New Url</button>
            </div>
        )
    }

    render() {
        return(
            <div>
                <p>File Page</p>
                <p><strong>{this.props.params.fileId}</strong></p>
                <div id="file-display-holder">{this.state.tag}</div>
                <button type="button"
                        id="download-button"
                        className="download-button"
                        onClick={() => this.retrieveFile(this.props.useDatabase, (err, res) => {
                            if (err) this.setState({ errorMessage: res.data.errorMessage });
                            else {
                                this.downloadFile();
                            }
                        })}>Download File</button>
                <button type="button" id="delete-button" className="delete-button" onClick={() => this.deleteFile(this.props.params.fileId, () => this.props.navigate(-1))}>Delete File</button>
                <br />
                {this.state.errorMessage !== null && <p id="update-form-error" className="error-message">{this.state.errorMessage}</p>}
                {this.state.isUsers && this.getUpdateFormHTML()}
                {this.state.isUsers && this.getShareableUrlHTML()}
            </div>
        )
    }
}

export default withWrapper(File)