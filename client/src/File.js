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
            })
            .then(res => {
                console.log(res.data)
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