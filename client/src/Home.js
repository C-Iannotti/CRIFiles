import React from "react";
import { withWrapper } from "./componentWrapper";
import {
    getFilePage
} from "./utils.js"
import $ from "jquery"


/*A React component for displaying the home page's
    information and interactions
*/
class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filesInput: 1,
            userInput: "",
            fileInput: ""
        };

        this.getFilePage = getFilePage.bind(this);
        this.handleFileSearch = this.handleFileSearch.bind(this);
        this.filePageInputKeyDown = this.filePageInputKeyDown.bind(this);
        this.getFileDisplayHTML = this.getFileDisplayHTML.bind(this);
    }

    componentDidMount() {
        this.handleFileSearch(1);
    }

    filePageInputKeyDown(e) {
        if (e.key === "Enter") {
            this.handleFileSearch(Number($("#page-number-input").val()))
        }
    }

    handleFileSearch(page) {
        this.getFilePage(page, {
            user: this.state.userInput,
            file: this.state.fileInput
        }, (err, res) => {
            if (err) {
                console.error(err);
                this.props.addMessage(res && res.data.errorMessage ? res.data.errorMessage : "Server error");
            }
        });
    }

    getFileDisplayHTML() {
        return (
            <div className="file-search-container">
                <div id="file-search" className="file-search">
                    <button type="button"
                            id="file-search-clear"
                            className="clear-button"
                            onClick={() => {
                                this.setState({
                                    userInput: "",
                                    fileInput: ""}, () => this.handleFileSearch(1))
                                }
                                }
                            >&times;</button>
                    <div id="file-search-inputs" className="file-search-inputs">
                        <input type="text"
                            id="user-file-input"
                            className="home-file-input"
                            placeholder="User ID or Name"
                            value={this.state.userInput}
                            onChange={e => {this.setState({userInput: e.target.value}, () => this.handleFileSearch(1))}}
                            />
                        <input type="text"
                            id="file-file-input"
                            className="home-file-input"
                            placeholder="File ID or Name"
                            value={this.state.fileInput}
                            onChange={e => {this.setState({fileInput: e.target.value}, () => this.handleFileSearch(1))}}
                            />
                    </div>
                    <div id="page-navigator" className="page-navigator">
                        <button type="button"
                                id="previous-page-button"
                                className="page-button"
                                onClick={() => { this.handleFileSearch(this.state.filesPage-1) }}
                                >&#706;</button>
                        <input type="text"
                                id="page-number-input"
                                className="page-number-input"
                                value={this.state.filesInput}
                                onKeyDown={this.filePageInputKeyDown}
                                onChange={e => this.setState({ filesInput: e.target.value })}
                        />
                        <p id="page-number-max"
                            className="page-number-max"> of {this.state.totalFiles ? Math.ceil(this.state.totalFiles / Number(process.env.REACT_APP_PAGE_SIZE)) : 1}
                            </p>
                        <button type="button"
                                id="next-page-button"
                                className="page-button"
                                onClick={() => { this.handleFileSearch(this.state.filesPage+1) }}
                                >&#707;</button>
                    </div>
                </div>
                {this.state.loadingFilePage ? 
                <div className="dot-flashing dot-flashing-data"></div>
                :
                (this.state.searchedFiles || []).map(file => {
                    return (
                        <div key={file._id}
                            className="file-display-box"
                            onClick={() => this.props.navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file._id)}
                            >
                            <div className="file-metadata">
                                <div className="file-metadata-subsection">
                                    <p className="displayname-metadata">{file.displayname}</p>
                                    <p className="privacy-metadata">{file.privacy}</p>
                                </div>
                                <p className="filename-metadata">{file.filename}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    
    render() {
        return (
            <div className="home-page">
                {this.getFileDisplayHTML()}
            </div>
        );
    }
}

export default withWrapper(Home);