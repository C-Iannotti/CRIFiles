import axios from "axios";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

export function getFilePage(page, data, callback=(() => { return })) {
    console.log(this.state)
    if ((page === 1) || (page > 1 && page <= Math.ceil(this.state.totalFiles / process.env.REACT_APP_PAGE_SIZE))) {
        if (this.state.filesController) this.state.filesController.abort();
        this.setState(({
            searchedFiles: [],
            filesPage: page,
            filesInput: page,
            filesController: new AbortController()
        }), err => {
            if (err) console.error(err)
            else {
                axios({
                    method: "post",
                    url: SERVER_URL + process.env.REACT_APP_USER_FILES_PATH + "/" + (page - 1),
                    withCredentials: true,
                    signal: this.state.filesController.signal,
                    data: data
                    })
                    .then(res => {
                        callback(null, res)
                    })
                    .catch(err => {
                        callback(err, err.response)
                    });
            }
        });
    }
    else {
        callback();
    }
};

export function getSearchedUsersPage(userString, pageNumber, callback=(() => { return })) {
    if (pageNumber === 1 || (pageNumber > 1 &&
            ((this.state.moreSearchedUsers === false && this.state.searchedUsersPage > pageNumber)
            || (this.state.moreSearchedUsers === undefined && userString !== "")
            || this.state.moreSearchedUsers === true))) {
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
                        callback(null, res);
                    })
                    .catch(err => {
                        callback(err, err.response);
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
            callback(null, res);
        })
        .catch(err => {
            callback(err, err.response);
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
            this.setState(res.data, () => {
                callback(null, res);
            });
        })
        .catch(err => {
            callback(err, err.response);
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
            callback(null, res);
        })
        .catch(err => {
            callback(err, err.response);
        });
};

export function createNewToken(fileId, callback=(() => { return })) {
    axios({
        method: "put",
        url: SERVER_URL + process.env.REACT_APP_UPDATE_TOKEN_PATH,
        withCredentials: true,
        data: {
            fileId: fileId
        }
        })
        .then(res => {
            callback(null, res);
        })
        .catch(err => {
            callback(err, err.response);
        });
};

export function logout(callback=(() => { return })) {
    axios({
        method: "get",
        url: SERVER_URL + process.env.REACT_APP_LOGOUT_PATH,
        withCredentials: true
        })
        .then(res => {
            callback(null, res);
        })
        .catch(err => {
            callback(err, err.response)
        });
};

export function uploadFile(file, privacy, trustedUsers, comment, callback=() => { return }) {
    axios({
        method: "post",
        url: SERVER_URL + process.env.REACT_APP_UPLOAD_PATH,
        data: {
            userFile: file,
            trustedUsers: JSON.stringify(trustedUsers),
            comment: comment,
            privacy: privacy
        },
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
        })
        .then(res => {
            callback(null, res)
        })
        .catch(err => {
            callback(err, err.response);
        })
};

export function retrieveFile(database, callback=(() => { return })) {
    database(db => {
        let objectStore = db.transaction(DB_STORE_NAME).objectStore(DB_STORE_NAME);

        let req1 = objectStore.openCursor(this.props.params.fileId);
        req1.onerror = event => {
            console.error("Unable to check database for file: " + event.target.errorcode);
        }
        req1.onsuccess = event => {
            let cursor = event.target.result;
            if (!cursor) {
                axios({
                    method: "post",
                    url: SERVER_URL + process.env.REACT_APP_RETRIEVE_FILE_PATH,
                    withCredentials: true,
                    responseType: "blob",
                    data: {
                        fileId: this.props.params.fileId,
                        token: this.props.params.token
                    }
                    })
                    .then(res => {
                        let transaction = db.transaction([DB_STORE_NAME], "readwrite");
                        transaction.oncomplete = event => {
                            console.log("Completed adding to database: " + event.target.result);
                            db.close();
                        }
                        transaction.onerror = event => {
                            console.error("Unable to locally store file: " + event.target.errorCode);
                            db.close();
                        };

                        let req2 = transaction.objectStore(DB_STORE_NAME).add({
                            fileId: this.props.params.fileId,
                            blob: res.data
                        });
                        req2.onsuccess = event => {
                            console.log("Added item: " + event.target.result);
                        };
                        req2.onerror = event => {
                            console.error("Unable to locally store file: " + event.target.errorCode);
                        };

                        callback(null, res.data);
                    })
                    .catch(err => {
                        callback(err, err.response);
                    });
            }
            else {
                console.log("Found local file");
                callback(null, cursor.value.blob);
            }
        }
    });
};

export function updateFile(fileId, trustedUsers, comment, privacy, callback=(() => { return })) {
    axios({
        method: "put",
        url: SERVER_URL + process.env.REACT_APP_UPDATE_METADATA_PATH,
        data: {
            fileId: fileId,
            trustedUsers: trustedUsers,
            comment: comment,
            privacy: privacy
        },
        withCredentials: true
        })
        .then(res => {
            callback(null, res)
        })
        .catch(err => {
            callback(err, err.response);
        })
};

export function registerUser(username, password, displayname, callback=(() => { return })) {      
    axios.post(SERVER_URL + process.env.REACT_APP_REGISTER_PATH, {
            username: username,
            password: password,
            displayname: displayname
        },
        {
            withCredentials: true
        })
        .then(res => {
            callback(null, res);
        })
        .catch(err => {
            callback(err, err.response);
        });
};

export function loginUser(username, password, callback=(() => { return })) {
    axios.post(SERVER_URL + process.env.REACT_APP_LOGIN_PATH, {
        username: username,
        password: password
        },
        {
            withCredentials: true
        })
        .then(res => {
            callback(null, res);
        })
        .catch(err => {
            callback(err, err.response);
        });
}; 