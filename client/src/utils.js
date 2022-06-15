import axios from "axios";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;

export function getFilePage(page) {
    return () => {
        if ((this.state.totalFiles === 0 && page === 1) || (page >= 1 && page <= Math.ceil(this.state.totalFiles / process.env.REACT_APP_PAGE_SIZE))) {
            if (this.state.filesController !== null) this.state.filesController.abort();
            this.setState(({
                searchedFiles: [],
                filesPage: page,
                filesInput: page,
                filesController: new AbortController()
            }), err => {
                if (err) console.error(err)
                else {
                    axios({
                        method: "get",
                        url: SERVER_URL + process.env.REACT_APP_USER_FILES_PATH + "/" + (page - 1),
                        withCredentials: true,
                        signal: this.state.filesController.signal
                        })
                        .then(res => {
                            this.setState({
                                searchedFiles: res.data.files,
                                totalFiles: res.data.totalFiles,
                                filesController: null
                            });
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            });
        }
    }
};

export function getUsersPage(userString, pageNumber) {
    return() => {
        console.log(this.state.moreSearchedUsers)
        console.log(this.state.moreSearchedUsers === undefined)
        if (pageNumber >= 1 && (this.state.moreSearchedUsers === undefined || this.state.moreSearchedUsers)) {
            console.log(userString, pageNumber)
            if (this.state.usersController !== null) this.state.usersController.abort();
            this.setState({
                searchedUsers: [],
                usersController: new AbortController(),
                usersInput: userString,
                searchedUsersPage: pageNumber
            }, err => {
                if (err) console.error(err)
                if (userString && pageNumber >= 1) {
                    axios({
                            method: "get",
                            url: SERVER_URL + process.env.REACT_APP_RETRIEVE_USERS_PATH
                                + "/" + this.state.usersInput + "/" + String(pageNumber - 1),
                            withCredentials: true,
                            signal: this.state.usersController.signal
                        })
                        .then(res => {
                            console.log(res.data.users)
                            this.setState({
                                searchedUsers: res.data.users,
                                moreSearchedUsers: res.data.moreSearchedUsers,
                                usersController: null
                            })
                        })
                        .catch(err => {
                            console.error(err);
                        });
                }
            })
        }
    }
};

export function getDisplayName(callback=(() => { return })) {
    axios({
        method: "get",
        url: SERVER_URL + process.env.REACT_APP_DISPLAYNAME_PATH,
        withCredentials: true
        })
        .then(res => {
            this.setState({ displayname: res.data.displayname }, () => {
                callback(res);
            });
        })
        .catch(err => {
            console.error(err);
        })
};

export function getFileMetadata(fileId, callback=(() => { return })) {
    axios({
        method: "get",
        url: SERVER_URL
             + process.env.REACT_APP_RETRIEVE_METADATA_PATH
             + "/"
             + fileId,
        withCredentials: true
        })
        .then(res => {
            res.data.trustedUsers = JSON.parse(res.data.trustedUsers)
            this.setState({ metadata: res.data}, () => {
                callback(res);
            });
        });
};

export function deleteFile(fileId, callback=(() => { return })) {
    return () => axios({
        method: "delete",
        url: SERVER_URL
             + process.env.REACT_APP_DELETE_FILE_PATH
             + "/"
             + fileId,
        withCredentials: true
        })
        .then(res => {
            if (res.status === 204) this.props.navigate(-1);
            else {
                console.log("Unable to delete file")
                callback();
            }
        });
};