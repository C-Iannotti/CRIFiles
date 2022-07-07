import React from "react";
import "./style.css";
import { withWrapper } from "./componentWrapper";
import $ from "jquery"
import {
    getFilePage,
    getSearchedUsersPage,
    getTrustedUsersPage,
    getDisplayName,
    uploadFile,
    deleteFile
} from "./utils.js"
import Loading from "./Loading.js"

class User extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            filesInput: 1,
            usersInput: "",
            fileInput: "",
            idInput: "",
            commentInput: ""
        };

        this.getFilePage = getFilePage.bind(this);
        this.getDisplayName = getDisplayName.bind(this);
        this.getSearchedUsersPage = getSearchedUsersPage.bind(this);
        this.getTrustedUsersPage = getTrustedUsersPage.bind(this)
        this.uploadFile = uploadFile.bind(this);
        this.deleteFile = deleteFile.bind(this);
        this.toggleTrustedUsersContainer = this.toggleTrustedUsersContainer.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleUserSearch = this.handleUserSearch.bind(this);
        this.handleTrustedUserDisplay = this.handleTrustedUserDisplay.bind(this);
        this.handleFileSearch = this.handleFileSearch.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.filePageInputKeyDown = this.filePageInputKeyDown.bind(this);
        this.handlePageEnter = this.filePageInputKeyDown.bind(this);
        this.getFileDisplayHTML = this.getFileDisplayHTML.bind(this);
        this.getFileUploadFormHTML = this.getFileUploadFormHTML.bind(this);
    }

    componentDidMount() {
        this.getDisplayName((err, res) => {
            if (err) {
                console.error(err);
                this.props.addMessage(res.data.errorMessage || "Server error");
                this.props.navigate("/", { replace: true });
            }
            else if (res.data.displayname) {
                this.setState({
                    displayname: res.data.displayname,
                    pageLoaded: true
                });
                this.handleFileSearch(1);
            }
            else {
                this.props.navigate("/", { replace: true });
            }
        })
        window.addEventListener("click", this.toggleTrustedUsersContainer);
    }

    componentWillUnmount() {
        window.removeEventListener("click", this.toggleTrustedUsersContainer);
    }

    filePageInputKeyDown(e) {
        if (e.key === "Enter") {
            this.handleFileSearch(Number($("#page-number-input").val()))
        }
    }

    handleUpload() {
        if (this.props.useRef.current.files[0]) {
            this.props.addMessage("Uploading file...");
            let file = this.props.useRef.current.files[0];
            let comment = document.getElementById("comment-input").value;
            let privacy = document.getElementById("privacy-input").value;

            this.uploadFile(file, privacy, this.state.trustedUsers || {}, comment, (err, res) => {
                if (err) {
                    console.error(err);
                    this.props.addMessage(res.data.errorMessage || "Server error");
                }
                else {
                    this.setState({
                        trustedUsers: {}
                    });
                    this.handleFileSearch(this.state.filesPage);
                    this.props.addMessage("Uploaded file!");
                }
            });
        }
        else {
            this.props.useRef.current.click();
        }
    }

    handleDelete(fileId) {
        this.props.addMessage("Deleting file...");
        this.deleteFile(fileId, (err, res) => {
            if (err) {
                console.error(err);
                this.props.addMessage(res.data.errorMessage || "Server error");
            }
            else {
                this.handleFileSearch(1);
                this.props.addMessage("Deleted file!");
            }
        })
    }

    handleFileSearch(page) {
        this.getFilePage(page, {
            file: this.state.fileInput,
            getUserFiles: true
        }, (err, res) => {
            if (err) {
                console.error(err);
                this.props.addMessage(res && res.data.errorMessage ? res.data.errorMessage : "Server error");
            }
        });
    }

    handleUserSearch(userString, page) {
        document.getElementById("previous-searched-users-button").setAttribute("disabled", "true")
        document.getElementById("next-searched-users-button").setAttribute("disabled", "true")
        this.getSearchedUsersPage(userString, page, (err, res) => {
            if (err) {
                console.error(err);
                this.props.addMessage(res.data && res.data.errorMessage ? res.data.errorMessage : "Server error");
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

    getFileDisplayHTML() {
        return (
            <div className="file-search-container">
                <div id="file-search" className="file-search">
                    <button type="button"
                            id="file-search-clear"
                            className="clear-button"
                            onClick={() => {
                                this.setState({
                                    userInput: "",
                                    idInput: "",
                                    fileInput: ""}, () => this.handleFileSearch(1))
                                }
                                }
                            >&times;</button>
                    <div id="file-search-inputs" className="file-search-inputs">
                        <input type="text"
                            id="file-file-input"
                            className="home-file-input"
                            placeholder="File ID or Name"
                            value={this.state.fileInput}
                            onChange={e => {this.setState({fileInput: e.target.value}, () => this.handleFileSearch(1))}}
                            />
                    </div>
                    <div id="page-navigator" className="page-navigator">
                        <button type="button"
                                id="previous-page-button"
                                className="page-button"
                                onClick={() => { this.handleFileSearch(this.state.filesPage-1) }}
                                >&#706;</button>
                        <input type="text"
                                id="page-number-input"
                                className="page-number-input"
                                value={this.state.filesInput}
                                onKeyDown={this.filePageInputKeyDown}
                                onChange={e => this.setState({ filesInput: e.target.value })}
                        />
                        <p id="page-number-max"
                            className="page-number-max"> of {this.state.totalFiles ? Math.ceil(this.state.totalFiles / Number(process.env.REACT_APP_PAGE_SIZE)) : 1}
                            </p>
                        <button type="button"
                                id="next-page-button"
                                className="page-button"
                                onClick={() => { this.handleFileSearch(this.state.filesPage+1) }}
                                >&#707;</button>
                    </div>
                </div>
                {this.state.loadingFilePage ?
                <div className="dot-flashing dot-flashing-data"></div>
                :
                (this.state.searchedFiles || []).map(file => {
                    return (
                        <div key={file._id}
                            className="file-display-box"
                            onClick={(e) => {!e.target.matches(".display-delete-button") && this.props.navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file._id);
                                }
                            }
                            >
                            <div className="file-metadata">
                                <div className="file-metadata-subsection">
                                    <p className="displayname-metadata">{file.displayname}</p>
                                    <p className="privacy-metadata">{file.privacy}</p>
                                </div>
                                <p className="filename-metadata">{file.filename}</p>
                            </div>
                            <button className="display-delete-button"
                                onClick={() => this.handleDelete(file._id)}>
                                &times;
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    getFileUploadFormHTML() {
        return (
            <form id="file-upload-form" className="file-upload-form">
                <div className="file-upload-form-inputs">
                    <input type="file"
                        id="hidden-file-input"
                        className="hidden-file-input"
                        name="userFile"
                        ref={this.props.useRef}
                        onChange={e => {
                            this.setState({currentFilename: e.target.files[0].name})
                        }}
                        />
                    <div id="file-input-container"
                        className="file-input-container">
                        <input type="text"
                            id="filename-display"
                            className="filename-display"
                            placeholder="Click to select a file"
                            value={this.state.currentFilename || "Click to select a file"}
                            onClick={() => this.props.useRef.current.click()}
                            readOnly
                            />
                        <select id="privacy-input" className="privacy-input-user" name="privacy" defaultValue="private">
                            <option value="private">Private</option>
                            <option value="shared">Shared</option>
                            <option value="public">Public</option>
                        </select>
                    </div>
                    <input type="text"
                        id="trusted-users-input"
                        className="trusted-users-input"
                        name="trustedUsers"
                        value={this.state.toggleTrustedUsers ? this.state.usersInput : `Trusted Users (${Object.keys(this.state.trustedUsers || {}).length} of ${process.env.REACT_APP_MAX_TRUSTED_USERS})`}
                        onChange={e => {this.handleUserSearch(e.target.value, 1)}}
                        maxLength="24"
                    />
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
                    <textarea type="text"
                        id="comment-input"
                        className="comment-input"
                        name="comment"
                        maxLength="500"
                        value={this.state.commentInput}
                        onChange={e => this.setState({ commentInput: e.target.value })}
                        ></textarea>
                </div>
                <div className="file-upload-form-buttons">
                    <button type="reset" 
                        id="file-reset-button" 
                        className="file-upload-form-button"
                        onClick={() => this.setState({trustedUsers: {}, trustedUsersView: [], currentFilename: undefined, commentInput: ""})}
                        >Reset</button>
                    <button type="button" 
                        id="file-upload-button" 
                        className="file-upload-form-button" 
                        onClick={this.handleUpload}>Submit</button>
                </div>
            </form>
        );
    }

    render() {
        if (!this.state.pageLoaded) return <Loading loadingMessage="Retrieving User's Page"/>
        else {
            return (
                <div className="user-page">
                    {this.getFileUploadFormHTML()}
                    {this.getFileDisplayHTML()}
                </div>
            )
        }
    }
}

export default withWrapper(User)