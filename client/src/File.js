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
        this.state = {};

        this.displayFile = this.displayFile.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.retrieveFile = this.retrieveFile.bind(this);
        this.deleteFile = this.deleteFile.bind(this);
        this.checkFile = this.checkFile.bind(this);

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
                console.log(res.data.size, process.env.REACT_APP_MAX_FILE_SIZE)
                console.log(res.data.size <= process.env.REACT_APP_MAX_FILE_SIZE)
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
                else if (res.data.size <= process.env.REACT_APP_MAX_FILE_SIZE * 100) {
                    console.log("Made it here")
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
        console.log(JSON.parse(process.env.REACT_APP_SUPPORTED_FILES))
        let url = window.URL.createObjectURL(blob);
        let frame = $("#file-display")[0]
        frame.contentWindow.location.replace(url);
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

    render() {
        return(
            <div>
                <p>File Page</p>
                <p><strong>{this.props.params.fileId}</strong></p>
                <iframe id="file-display" className="file-display" title="File Display" sandbox=""></iframe>
                <br />
                <button type="button" id="download-button" className="download-button" onClick={() => this.retrieveFile(this.downloadFile)}>Download File</button>
                <button type="button" id="delete-button" className="delete-button" onClick={this.deleteFile}>Delete File</button>
                <button type="button" id="display-button" className="display-button" onClick={() => this.retrieveFile(this.displayFile)}>Display File</button>
            </div>
        )
    }
}

export default withWrapper(File)