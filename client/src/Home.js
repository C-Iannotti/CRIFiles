import React from "react";
import { withWrapper } from "./componentWrapper";

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};

    }
    
    render() {
        return (
            <h1>It be home here</h1>
        );
    }
}

export default withWrapper(Home);