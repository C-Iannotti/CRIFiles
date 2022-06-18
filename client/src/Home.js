import React from "react";
import { withWrapper } from "./componentWrapper";
import {
    getFilePage
} from "./utils.js"

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filesInput: 1
        };

        this.getFilePage = getFilePage.bind(this);
        this.getFileDisplayHTML = this.getFileDisplayHTML.bind(this);
    }

    componentDidMount() {
        this.getFilePage(1);
    }

    getFileDisplayHTML() {
        return (
            <div className="file-search">
                <input type="text" id="display-file-input" className="home-file-input" placeholder="Display Name" />
                <input type="text" id="filename-file-input" className="home-file-input" placeholder="Filename" />
                <input type="text" id="user-file-input" className="home-file-input" placeholder="User ID" />

                {this.state.totalFiles !== null && <p>{this.state.totalFiles}</p>}
                <div id="page-navigator" className="page-navigator">
                    <button type="button"
                            id="previous-page-button"
                            className="page-button"
                            onClick={() => { this.getFilePage(this.state.filesPage-1) }}
                            >Previous</button>
                    <input  type="text"
                            id="page-number-input"
                            className="page-number-input"
                            value={this.state.filesInput}
                            onKeyDown={this.filePageInputKeyDown}
                            onChange={e => this.setState({ filesInput: e.target.value })}
                    />
                    <button type="button"
                            id="next-page-button"
                            className="page-button"
                            onClick={() => { this.getFilePage(this.state.filesPage+1) }}
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