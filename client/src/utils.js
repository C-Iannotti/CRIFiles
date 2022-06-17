import axios from "axios";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;

export function getFilePage(page, callback=(() => { return })) {
    if ((page === 1) || (page > 1 && page <= Math.ceil(this.state.totalFiles / process.env.REACT_APP_PAGE_SIZE))) {
        if (this.state.filesController !== undefined) this.state.filesController.abort();
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
                            filesController: undefined
                        });
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
        });
    }
    else {
        callback();
    }
};

export function getSearchedUsersPage(userString, pageNumber, callback=(() => { return })) {
    if (pageNumber >= 1 &&
            ((this.state.moreSearchedUsers === false && this.state.searchedUsersPage > pageNumber)
            || (this.state.moreSearchedUsers === undefined && userString !== "")
            || this.state.moreSearchedUsers === true)) {
        this.setState({
            searchedUsers: [],
            usersInput: userString,
            searchedUsersPage: pageNumber,
            moreSearchedUsers: undefined
        }, err => {
            if (err) console.error(err)
            if (userString && pageNumber >= 1) {
                axios({
                        method: "get",
                        url: SERVER_URL + process.env.REACT_APP_RETRIEVE_USERS_PATH
                            + "/" + this.state.usersInput + "/" + String(pageNumber - 1),
                        withCredentials: true,
                    })
                    .then(res => {
                        this.setState({
                            searchedUsers: res.data.users,
                            moreSearchedUsers: res.data.moreSearchedUsers,
                        }, () => callback());
                    })
                    .catch(err => {
                        console.error(err);
                    });
            }
        })
    }
    else if (userString === "") {
        this.setState({
            searchedUsers: [],
            usersInput: userString,
            searchedUsersPage: 1,
            moreSearchedUsers: undefined
        }, () => {
            callback();
        })
    }
    else {
        callback();
    }
};

export function getTrustedUsersPage(pageNumber, callback=(() => { return })) {
    if (pageNumber >= 1 && 
        pageNumber <= Math.ceil(Object.keys(this.state.trustedUsers).length /
            Number(process.env.REACT_APP_PAGE_SIZE))) {
        this.setState({
            trustedUsersPage: pageNumber,
            trustedUsersView: Object.values(this.state.trustedUsers).slice(
                (pageNumber - 1) * Number(process.env.REACT_APP_PAGE_SIZE),
                pageNumber * Number(process.env.REACT_APP_PAGE_SIZE))
        }, () => {
            callback()
        })
    }
    else if (Object.keys(this.state.trustedUsers).length <= (pageNumber - 1) * Number(process.env.REACT_APP_PAGE_SIZE)) {
        pageNumber = Math.ceil(Object.keys(this.state.trustedUsers).length /
        Number(process.env.REACT_APP_PAGE_SIZE))
        this.setState({
            trustedUsersPage: pageNumber,
            trustedUsersView: Object.values(this.state.trustedUsers).slice(
                (pageNumber - 1) * Number(process.env.REACT_APP_PAGE_SIZE),
                pageNumber * Number(process.env.REACT_APP_PAGE_SIZE))
        }, () => {
            callback();
        })
    }
    else {
        callback();
    }
}

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

export function getFileMetadata(fileId, token=undefined, callback=(() => { return })) {
    axios({
        method: "post",
        url: SERVER_URL + process.env.REACT_APP_RETRIEVE_METADATA_PATH,
        withCredentials: true,
        data: {
            fileId: fileId,
            token: token
        }
        })
        .then(res => {
            res.data.trustedUsers = JSON.parse(res.data.trustedUsers)
            this.setState(res.data, () => {
                callback(res);
            });
        })
        .catch(err => {
            console.error(err);
        });
};

export function deleteFile(fileId, callback=(() => { return })) {
    axios({
        method: "delete",
        url: SERVER_URL
             + process.env.REACT_APP_DELETE_FILE_PATH
             + "/"
             + fileId,
        withCredentials: true
        })
        .then(res => {
            this.props.navigate(-1);
            callback();
        })
        .catch(err => {
            console.error(err);
        });
};

export function createNewToken(fileId, callback=(() => { return })) {
    console.log("Should do something")
    axios({
        method: "put",
        url: SERVER_URL + process.env.REACT_APP_UPDATE_TOKEN_PATH,
        withCredentials: true,
        data: {
            fileId: fileId
        }
        })
        .then(res => {
            callback();
        })
        .catch(err => {
            console.error(err);
        });
};

export function logout(callback=(() => { return })) {
    axios({
        method: "get",
        url: SERVER_URL + process.env.REACT_APP_LOGOUT_PATH,
        withCredentials: true
        })
        .then(res => {
            callback();
        })
        .catch(err => {
            console.error(err)
        });
}