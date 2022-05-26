import React from "react";
import axios from "axios";
import "./style.css";
import { withRouter } from "./withRouter";

const URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;

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
                console.log(res)
                console.log(res.headers);
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

export default withRouter(File)