import React from "react";
import axios from "axios";
import "./style.css";
import { withWrapper } from "./comonentWrapper";

const URL = process.env.REACT_APP_PROTOCOL
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
        let file = document.getElementById("file-upload").files[0];
        let getUserFiles = this.getUserFiles;
        console.log("Here");
        console.log(typeof(file));

        axios({
            method: "post",
            url: URL + process.env.REACT_APP_UPLOAD_PATH,
            data: { userFile: file },
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true
            })
            .then(function(res) {
                getUserFiles();
            })
            .catch(function(err) {
                console.error(err);
            });
        this.forceUpdate()
    }

    getUserFiles() {
        //let setState = this.setState
        axios({
            method: "get",
            url: URL + process.env.REACT_APP_USER_FILES_PATH,
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
                    <p><strong>{file.file}</strong></p>
                    <p>{file.user}</p>
                    <p>{file.privacy}</p>
                    <button
                        type="button"
                        className="open-file-button"
                        onClick={() => navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file.file)}
                    >Open File</button>
                </div>
            );
        }

        return (
            <div className="user-page">
                <p>Hello user user</p>
                <div className="upload-form">
                    <label htmlFor="file-upload">Select a file:</label>
                    <input type="file" id="file-upload" name="userFile" />
                    <button type="button" id="upload-button" className="upload-button" onClick={this.handleUpload}>Upload File</button>
                </div>
                {filesHtml}
            </div>
        )
    }
}

export default withWrapper(User)