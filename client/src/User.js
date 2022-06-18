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
            usersInput: ""
        };

        this.getFilePage = getFilePage.bind(this);
        this.getDisplayName = getDisplayName.bind(this);
        this.getSearchedUsersPage = getSearchedUsersPage.bind(this);
        this.getTrustedUsersPage = getTrustedUsersPage.bind(this)
        this.uploadFile = uploadFile.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.filePageInputKeyDown = this.filePageInputKeyDown.bind(this);
        this.handlePageEnter = this.filePageInputKeyDown.bind(this);
        this.getFileDisplayHTML = this.getFileDisplayHTML.bind(this);
        this.getFileUploadFormHTML = this.getFileUploadFormHTML.bind(this);
    }

    componentDidMount() {
        this.getDisplayName(() => {
            if (this.state.displayname) {
                this.getFilePage(1, { getUserFiles: true });
            }
            else {
                this.props.navigate("/", { replace: true });
            }
        })
    }

    filePageInputKeyDown(e) {
        if (e.key === "Enter") {
            this.getFilePage(Number($("#page-number-input").val()), { getUserFiles: true })
        }
    }

    handleUpload() {
        let file = document.getElementById("file-input").files[0];
        let comment = document.getElementById("comment-input").value;
        let privacy = document.getElementById("privacy-input").value;

        this.uploadFile(file, privacy, this.state.trustedUsers || {}, comment, () => {
            this.getFilePage(this.state.filesPage, { getUserFiles: true });
        });
    }

    getFileDisplayHTML() {
        return (
            <div className="file-search">
                {this.state.totalFiles !== null && <p>{this.state.totalFiles}</p>}
                <div id="page-navigator" className="page-navigator">
                    <button type="button"
                            id="previous-page-button"
                            className="page-button"
                            onClick={() => this.getFilePage(this.state.filesPage-1, { getUserFiles: true })}
                            >Previous</button>
                    <input  type="text"
                            id="page-number-input"
                            className="page-number-input"
                            value={this.state.filesInput}
                            onKeyDown={this.filePageInputKeyDown}
                            onChange={e => this.setState({ filesInput: e.target.value })}
                    />
                    <button type="button"
                            id="next-page-button"
                            className="page-button"
                            onClick={() => this.getFilePage(this.state.filesPage+1, { getUserFiles: true })}
                            >Next</button>
                </div>
                {(this.state.searchedFiles || []).map(file => {
                    return (
                        <div key={file._id} className="file-meta-data">
                            <p><strong>{file._id}</strong></p>
                            <p>{file.filename}</p>
                            <p>{file.privacy}</p>
                            <button
                                type="button"
                                className="open-file-button"
                                onClick={() => this.props.navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file._id)}
                            >Open File</button>
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
                       onChange={e => {this.getSearchedUsersPage(e.target.value, this.state.searchedUsersPage || 1)}}
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