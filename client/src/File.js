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
        this.handleDownload = this.handleDownload.bind(this);
        this.deleteFile = this.deleteFile.bind(this);

        axios({
            method: "get",
            url: SERVER_URL
                 + process.env.REACT_APP_RETRIEVE_METADATA_PATH
                 + "/"
                 + this.props.params.fileId,
            withCredentials: true
            })
            .then(res => {
                console.log(res.data)
            });
    }

    displayFile() {
        this.props.useDatabase(db => {
            db.transaction(DB_STORE_NAME)
                .objectStore(DB_STORE_NAME)
                .get(this.props.params.fileId)
                .onsuccess = event => {
                    console.log(event.target.result);
                }
            db.close();
        });
    }
    handleDownload() {
        this.props.useDatabase(db => {
            let transaction = db.transaction([DB_STORE_NAME], "readwrite");
            transaction.oncomplete = event => {
                console.log("Completed looking for file: " + event.target.result);
            }
            transaction.onerror = event => {
                console.error("Unable to check database: " + event.target.errorCode);
                db.close();
            };

            let req1 = transaction.objectStore(DB_STORE_NAME).openCursor(this.props.params.fileId);
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
                                this.displayFile();
                            };
                            req2.onerror = event => {
                                console.error("Unable to locally store file: " + event.target.errorCode);
                            };

                            this.downloadFile(res.data, res.headers["filename"]);
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
                else {
                    this.downloadFile(cursor.value.blob, cursor.value.filename)
                }
            }
        });
    }

    downloadFile(blob, name) {
        let a = $("<a style='display: none;'/>");
        let url = window.URL.createObjectURL(blob);
        a.attr("href", url);
        a.attr("download", name);
        $("body").append(a);
        a[0].click();
        window.URL.revokeObjectURL(url);
        a.remove();
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
                <button type="button" id="download-button" className="download-button" onClick={this.handleDownload}>Download File</button>
                <button type="button" id="delete-button" className="delete-button" onClick={this.deleteFile}>Delete File</button>
            </div>
        )
    }
}

export default withWrapper(File)