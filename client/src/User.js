import React from "react";
import "./style.css";
import { withWrapper } from "./componentWrapper";
import $ from "jquery"
import {
    getFilePage,
    getSearchedUsersPage,
    getTrustedUsersPage,
    getDisplayName,
    uploadFile
} from "./utils.js"

class User extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            filesInput: 1,
            usersInput: "",
            filenameInput: "",
            idInput: ""
        };

        this.getFilePage = getFilePage.bind(this);
        this.getDisplayName = getDisplayName.bind(this);
        this.getSearchedUsersPage = getSearchedUsersPage.bind(this);
        this.getTrustedUsersPage = getTrustedUsersPage.bind(this)
        this.uploadFile = uploadFile.bind(this);
        this.handleUserSearch = this.handleUserSearch.bind(this);
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
                this.props.navigate("/", { replace: true });
            }
            else if (res.data.displayname) {
                this.setState({
                    displayname: res.data.displayname,
                });
                this.handleFileSearch(1);
            }
            else {
                this.props.navigate("/", { replace: true });
            }
        })
    }

    filePageInputKeyDown(e) {
        if (e.key === "Enter") {
            this.handleFileSearch(Number($("#page-number-input").val()))
        }
    }

    handleUpload() {
        let file = document.getElementById("file-input").files[0];
        let comment = document.getElementById("comment-input").value;
        let privacy = document.getElementById("privacy-input").value;

        this.uploadFile(file, privacy, this.state.trustedUsers || {}, comment, (err, res) => {
            if (err) console.error(err);
            else {
                this.setState({
                    trustedUsers: {}
                });
                this.handleFileSearch(this.state.filesPage);
            }
        });
    }

    handleFileSearch(page) {
        this.getFilePage(page, {
            filename: this.state.filenameInput,
            _id: this.state.idInput,
            getUserFiles: true
        }, (err, res) => {
            if (err) console.error(err);
            else if (res) {
                this.setState({
                    searchedFiles: res.data.files,
                    totalFiles: res.data.totalFiles,
                    filesController: undefined
                });
            }
        })
    }

    handleUserSearch(userString, page) {
        document.getElementById("previous-searched-users-button").setAttribute("disabled", "true")
        document.getElementById("next-searched-users-button").setAttribute("disabled", "true")
        this.getSearchedUsersPage(userString, page, (err, res) => {
            if (err) {
                console.error(err);
                document.getElementById("previous-searched-users-button").removeAttribute("disabled");
                document.getElementById("next-searched-users-button").removeAttribute("disabled");
            }
            else if (res) {
                this.setState({
                    searchedUsers: res.data.users,
                    moreSearchedUsers: res.data.moreSearchedUsers,
                }, () => {
                    document.getElementById("previous-searched-users-button").removeAttribute("disabled");
                    document.getElementById("next-searched-users-button").removeAttribute("disabled");
                });
            }
            else {
                document.getElementById("previous-searched-users-button").removeAttribute("disabled");
                document.getElementById("next-searched-users-button").removeAttribute("disabled");
            }
        });
    }

    getFileDisplayHTML() {
        return (
            <div className="file-search-container">
                <div id="home-file-search" className="home-file-search">
                    <button type="button"
                            id="file-search-clear"
                            className="clear-button"
                            onClick={() => {
                                this.setState({
                                    userInput: "",
                                    idInput: "",
                                    filenameInput: ""}, () => this.handleFileSearch(this.state.filesPage, this.state.search))
                                }
                                }
                            >&#10006;</button>
                    <div id="file-search-inputs" className="file-search-inputs">
                        <input type="text"
                            id="id-file-input"
                            className="home-file-input"
                            placeholder="File ID"
                            value={this.state.idInput}
                            onChange={e => {this.setState({idInput: e.target.value}, () => this.handleFileSearch(this.state.filesPage))}}
                            />
                        <input type="text"
                            id="filename-file-input"
                            className="home-file-input"
                            placeholder="Filename"
                            value={this.state.filenameInput}
                            onChange={e => {this.setState({filenameInput: e.target.value}, () => this.handleFileSearch(this.state.filesPage))}}
                            />
                    </div>
                </div>
                <div id="page-navigator" className="page-navigator">
                    <button type="button"
                            id="previous-page-button"
                            className="page-button"
                            onClick={() => { this.handleFileSearch(this.state.filesPage-1) }}
                            >Previous</button>
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
                            >Next</button>
                </div>
                {(this.state.searchedFiles || []).map(file => {
                    return (
                        <div key={file._id}
                            className="file-meta-data"
                            onClick={() => this.props.navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file._id)}
                            >
                            <p>{file.filename}</p>
                            <p>{file.privacy}</p>
                        </div>
                    )
                })}
            </div>
        )
    }

    getFileUploadFormHTML() {
        return (
            <form id="file-upload-form" className="file-upload-form">
                <label htmlFor="file-upload">Select a file:</label>
                <input type="file" id="file-input" className="file-input" name="userFile" />
                <select id="privacy-input" className="privacy-input" name="privacy" defaultValue="private">
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                </select>
                <input type="text"
                       id="trusted-users-input"
                       className="trusted-users-input"
                       name="trustedUsers"
                       value={this.state.usersInput}
                       onChange={e => {this.handleUserSearch(e.target.value, 1)}}
                       maxLength="20"
                />
                <div className="users-display">
                    <div className="searched-users-display">
                        <button type="button"
                                id="previous-searched-users-button"
                                className="page-button"
                                onClick={() => this.handleUserSearch(this.state.usersInput, this.state.searchedUsersPage-1)}
                                >Previous</button>
                        <button type="button"
                                id="next-searched-users-button"
                                className="page-button"
                                onClick={() => this.handleUserSearch(this.state.usersInput, this.state.searchedUsersPage+1)}
                                >Next</button>
                        {(this.state.searchedUsers || []).map(user => {
                            return (
                                <div key={user._id + "_searched"} className="user-item-display" onClick={() => {
                                    let trustedUsers = this.state.trustedUsers || {};
                                    trustedUsers[user._id] = user;
                                    this.setState({ trustedUsers: trustedUsers }, () => {
                                        this.getTrustedUsersPage(this.state.trustedUsersPage || 1);
                                    });
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
                                    this.setState({ trustedUsers: trustedUsers }, () => {
                                        this.getTrustedUsersPage(this.state.trustedUsersPage || 1);
                                    });
                                }}>
                                    {user.displayname + ": " + user._id}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <input type="text" id="comment-input" className="comment-input" name="comment" defaultValue="" maxLength="500" />
                <input type="reset" id="file-reset-button" className="file-reset-button" value="Reset" onClick={() => this.setState({trustedUsers: {}, trustedUsersView: []})}/>
                <button type="button" id="file-upload-button" className="file-upload-button" onClick={this.handleUpload}>Submit</button>
            </form>
        );
    }

    render() {
        return (
            <div className="user-page">
                {this.getFileUploadFormHTML()}
                {this.getFileDisplayHTML()}
            </div>
        )
    }
}

export default withWrapper(User)