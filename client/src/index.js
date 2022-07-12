import React from "react";
import ReactDOM from "react-dom/client";
import { 
    BrowserRouter,
    Routes,
    Route } from "react-router-dom";
import Home from "./Home.js";
import User from "./User.js";
import File from "./File.js";
import Header from "./Header.js"

/*React component for displaying the website
    with Routes for each page and popup messages
*/
class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            currentMessages: ["Uploaded file..."]
        }

        this.addMessage = this.addMessage.bind(this);
    }

    addMessage(message) {
        this.setState({
            currentMessages: this.state.currentMessages.concat([message])
        })
    }

    getMessageDisplayHTML() {
        return (
            <div className="message-container">
                <div className="total-messages"
                    onMouseEnter={() => this.setState({ isHoveredTotalMessages: true })}
                    onMouseLeave={() => this.setState({ isHoveredTotalMessages: false })}
                    onClick={() => this.setState({ currentMessages: [], isHoveredTotalMessages: false })}
                    >{this.state.isHoveredTotalMessages ? "X" : this.state.currentMessages.length}</div>
                <div className="current-message">
                    <p>{this.state.currentMessages[0]}</p>
                    <button type="button"
                        id="message-clear-button"
                        className="message-clear-button"
                        onClick={() => this.setState({ currentMessages: this.state.currentMessages.slice(1) })}
                        >X</button>
                </div>
            </div>
        )
    }

    render() {
        return (
            <BrowserRouter>
                <div className="app">
                    <Header addMessage={this.addMessage} />
                    <Routes>
                        <Route path="/" element={<Home addMessage={this.addMessage}/>} />
                        <Route path="/user" element={<User addMessage={this.addMessage} />} />
                        <Route path="/file/:fileId" element={<File addMessage={this.addMessage} />} />
                        <Route path="/file/:fileId/:token" element={<File addMessage={this.addMessage} />} />
                        <Route 
                            path="*"
                            element={
                                <main style={{ padding: "1rem" }}>
                                    <p>Unable to find Route!</p>
                                </main>
                            }
                        />
                    </Routes>
                    {this.state.currentMessages.length > 0 && this.getMessageDisplayHTML()}
                </div>
            </BrowserRouter>
        )
    }
}

const root = ReactDOM.createRoot(
    document.getElementById("root")
);

root.render(<App />);