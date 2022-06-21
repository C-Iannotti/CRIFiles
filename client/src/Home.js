import React from "react";
import { withWrapper } from "./componentWrapper";
import {
    getFilePage
} from "./utils.js"
import $ from "jquery"

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filesInput: 1,
            userInput: "",
            filenameInput: "",
            idInput: ""
        };

        this.getFilePage = getFilePage.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.filePageInputKeyDown = this.filePageInputKeyDown.bind(this);
        this.getFileDisplayHTML = this.getFileDisplayHTML.bind(this);
    }

    componentDidMount() {
        this.getFilePage(1);
    }

    filePageInputKeyDown(e) {
        if (e.key === "Enter") {
            this.handleSearch(Number($("#page-number-input").val()))
        }
    }

    handleSearch(page) {
        this.getFilePage(page, {
            user: this.state.userInput,
            filename: this.state.filenameInput,
            _id: this.state.idInput
        })
    }

    getFileDisplayHTML() {
        return (
            <div className="file-search-container">
                <div id="home-file-search" className="home-file-search">
                    <button type="button"
                            id="file-search-clear"
                            className="clear-button"
                            onClick={() => {
                                this.setState({
                                    userInput: "",
                                    idInput: "",
                                    filenameInput: ""}, () => this.handleSearch(this.state.filesPage, this.state.search))
                                }
                                }
                            >&#10006;</button>
                    <div id="file-search-inputs" className="file-search-inputs">
                        <input type="text"
                            id="user-file-input"
                            className="home-file-input"
                            placeholder="User ID"
                            value={this.state.userInput}
                            onChange={e => {this.setState({userInput: e.target.value}, () => this.handleSearch(this.state.filesPage))}}
                            />
                        <input type="text"
                            id="id-file-input"
                            className="home-file-input"
                            placeholder="File ID"
                            value={this.state.idInput}
                            onChange={e => {this.setState({idInput: e.target.value}, () => this.handleSearch(this.state.filesPage))}}
                            />
                        <input type="text"
                            id="filename-file-input"
                            className="home-file-input"
                            placeholder="Filename"
                            value={this.state.filenameInput}
                            onChange={e => {this.setState({filenameInput: e.target.value}, () => this.handleSearch(this.state.filesPage))}}
                            />
                    </div>
                </div>
                <div id="page-navigator" className="page-navigator">
                    <button type="button"
                            id="previous-page-button"
                            className="page-button"
                            onClick={() => { this.handleSearch(this.state.filesPage-1) }}
                            >Previous</button>
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
                            onClick={() => { this.handleSearch(this.state.filesPage+1) }}
                            >Next</button>
                </div>
                {(this.state.searchedFiles || []).map(file => {
                    return (
                        <div key={file._id} className="file-meta-data">
                            <p><strong>{file._id}</strong></p>
                            <p>{file.filename}</p>
                            <p>{file.privacy}</p>
                            <button
                                type="button"
                                className="open-file-button"
                                onClick={() => this.props.navigate(".." + process.env.REACT_APP_FILE_PAGE + "/" + file._id)}
                            >Open File</button>
                        </div>
                    )
                })}
            </div>
        )
    }
    
    render() {
        return (
            <div>
                {this.getFileDisplayHTML()}
            </div>
        );
    }
}

export default withWrapper(Home);