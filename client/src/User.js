import React from "react";
import axios from "axios";
import "./style.css";
import { withWrapper } from "./comonentWrapper";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;

class User extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            userFiles: []
        };
        this.handleUpload = this.handleUpload.bind(this);
        this.getUserFiles = this.getUserFiles.bind(this);

        this.getUserFiles();
    }

    handleUpload() {
        console.log("why are we her")
        console.log("what")
        let file = document.getElementById("file-input").files[0];
        console.log("Check form elements");
        let trustedUsers = document.getElementById("trusted-users-input").value;
        console.log("Have users");
        let comment = document.getElementById("comment-input").value;
        console.log("Have comment");
        let privacy = document.getElementById("privacy-input").value;
        let getUserFiles = this.getUserFiles;

        axios({
            method: "post",
            url: SERVER_URL + process.env.REACT_APP_UPLOAD_PATH,
            data: { 
                userFile: file,
                trustedUsers: trustedUsers,
                comment: comment,
                privacy: privacy
            },
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
            })
            .then(function(res) {
                console.log(res);
                getUserFiles();
            })
            .catch(function(err) {
                console.error(err);
            });
        this.forceUpdate()
    }

    getUserFiles() {
        axios({
            method: "get",
            url: SERVER_URL + process.env.REACT_APP_USER_FILES_PATH,
            withCredentials: true
            })
            .then(res => {
                this.setState({
                    userFiles: res.data
                });
            })
            .catch(function(err) {
                console.error(err);
                return null;
            })
    }

    render() {
        let navigate = this.props.navigate;
        let filesHtml = [];
        for (const file of this.state.userFiles) {
            filesHtml.push(
                <div key={file._id} className="file-meta-data">
                    <p><strong>{file._id}</strong></p>
                    <p>{file.fileName}</p>
                    <p>{file.privacy}</p>
                    <button
                        type="button"
                        className="open-file-button"
                        onClick={() => navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file._id)}
                    >Open File</button>
                </div>
            );
        }

        return (
            <div className="user-page">
                <p>Hello user user</p>
                <form id="file-upload-form" className="file-upload-form">
                    <label htmlFor="file-upload">Select a file:</label>
                    <input type="file" id="file-input" className="file-input" name="userFile" />
                    <select id="privacy-input" className="privacy-input" name="privacy" defaultValue="private">
                        <option value="private">Private</option>
                        <option value="shared">Shared</option>
                        <option value="public">Public</option>
                    </select>
                    <input type="text" id="trusted-users-input" className="trusted-users-input" name="trustedUsers" defaultValue="[]" maxLength="500" />
                    <input type="text" id="comment-input" className="comment-input" name="comment" defaultValue="" maxLength="500" />
                    <input type="reset" id="file-reset-button" className="file-reset-button" value="Reset" />
                    <button type="button" id="file-upload-button" className="file-upload-button" onClick={this.handleUpload}>Submit</button>
                </form>
                {filesHtml}
            </div>
        )
    }
}

export default withWrapper(User)