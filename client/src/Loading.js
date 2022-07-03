import React from "react";

export default class Loading extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        return(
            <div className="loading-page">
                <p className="loading-message">{this.props.loadingMessage || "Loading"}</p>
                <div className="dot-flashing dot-flashing-loading"></div>
            </div>
        )
    }
}