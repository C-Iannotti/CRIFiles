import React from "react";
import axios from "axios";
import "./style.css";
import { withWrapper } from "./comonentWrapper";

const URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

class File extends React.Component {
    constructor(props) {
        super(props)
        axios({
            method: "get",
            url: URL
                 + process.env.REACT_APP_RETRIEVE_FILE_PATH
                 + "/"
                 + this.props.params.fileId,
            withCredentials: true,
            responseType: "blob"
            })
            .then(res => {
                console.log(res)
                this.props.useDatabase(db => {
                    let transaction = db.transaction([DB_STORE_NAME], "readwrite");
                    transaction.oncomplete = event => {
                        console.log(event.target.result)
                    };
                    transaction.onerror = event => {
                        console.error("Unable to get file from server: " + event.target.errorCode);
                    };
                    let objectStore = transaction.objectStore(DB_STORE_NAME);
                    let request = objectStore.add({
                        fileId: this.props.params.fileId,
                        filename: res.headers["filename"],
                        mimetype: res.headers["content-type"],
                        blob: res.data
                    });
                    request.onsuccess = event => {
                        console.log(event.target.result)
                    };
                    request.onerror = event => {
                        console.error("Unable to locally store file: " + event.target.errorCode);
                    };
                })
            })
            .catch(err => {
                console.error(err);
            });
    }

    render() {
        return(
            <div>
                <p>File Page</p>
                <p><strong>{this.props.params.fileId}</strong></p>
            </div>
        )
    }
}

export default withWrapper(File)