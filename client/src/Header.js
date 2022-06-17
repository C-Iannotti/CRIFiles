import React from "react"
import {
    getDisplayName,
    logout
} from "./utils.js"

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
        this.getDisplayName = getDisplayName.bind(this);
        this.logout = logout.bind(this);
    }
    componentDidMount() {
        this.getDisplayName();
    }

    render() {
        return(
            <div id="header" className="header">
                <h1>Hello User {this.state.displayname}</h1>
                <button type="button"
                        id="logout-button"
                        className="logout-button"
                        onClick={() => (this.logout(this.getDisplayName))}
                        >Logout</button>
            </div>
        );
    }
}

export default Header