import axios from "axios";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

/*
 * param: pageNumber (valid number for page of files)
 * param: data (object containing acceptable conditions)
 * param: callback (callable function)
 * use: makes an API call to retrieve pageNumber file page
 *   meeting data conditions and sends either an error,
 *   response, or nothing to the callback upon completion 
 */
export function getFilePage(pageNumber, data, callback=(() => { return })) {
    if ((pageNumber === 1) || (pageNumber > 1 && pageNumber <= Math.ceil(this.state.totalFiles / process.env.REACT_APP_PAGE_SIZE))) {
        if (this.state.filesController) this.state.filesController.abort();
        this.setState(({
            searchedFiles: [],
            filesPage: pageNumber,
            filesInput: pageNumber,
            filesController: new AbortController(),
            loadingFilePage: true
        }), () => {
            axios({
                method: "post",
                url: SERVER_URL + process.env.REACT_APP_USER_FILES_PATH + "/" + (pageNumber - 1),
                withCredentials: true,
                signal: this.state.filesController.signal,
                data: data
                })
                .then(res => {
                    this.setState({
                        searchedFiles: res.data.files,
                        totalFiles: res.data.totalFiles,
                        filesController: undefined,
                        loadingFilePage: undefined
                    }, () => callback(null, res));
                })
                .catch(err => {
                    if (err.res) callback(err, err.response);
                    else callback();
                });
        });
    }
    else {
        callback();
    }
};

/*
 * param: userString (string of characters)
 * param: pageNumber (valid number for page of users)
 * param: callback (callable function)
 * use: makes an API call to retrieve pageNumber users page
 *   with userString preceding characters and sends either
 *   an error, response, or nothing to the callback upon
 *   completion 
 */
export function getSearchedUsersPage(userString, pageNumber, callback=(() => { return })) {
    if (pageNumber === 1 || (pageNumber > 1 &&
            ((this.state.moreSearchedUsers === false && this.state.searchedUsersPage > pageNumber)
            || (this.state.moreSearchedUsers === undefined && userString !== "")
            || this.state.moreSearchedUsers === true))) {
        if (this.state.searchedUsersController) this.state.searchedUsersController.abort();
        this.setState({
            searchedUsers: [],
            usersInput: userString,
            searchedUsersPage: pageNumber,
            moreSearchedUsers: undefined,
            loadingSearchedUsers: true,
            searchedUsersController: new AbortController()
        }, () => {
            if (userString) {
                axios({
                        method: "get",
                        url: SERVER_URL + process.env.REACT_APP_RETRIEVE_USERS_PATH
                            + "/" + this.state.usersInput + "/" + String(pageNumber - 1),
                        withCredentials: true,
                        signal: this.state.searchedUsersController.signal
                    })
                    .then(res => {
                        this.setState({
                            searchedUsersPage: pageNumber,
                            searchedUsers: res.data.users,
                            moreSearchedUsers: res.data.moreSearchedUsers,
                            loadingSearchedUsers: undefined,
                            searchedUsersController: undefined
                        }, () => callback(null, res));
                    })
                    .catch(err => {
                        if (err.res) callback(err, err.response);
                        else callback();
                    });
            }
            else {
                this.setState({
                    searchedUsersPage: 1,
                    loadingSearchedUsers: undefined
                }, () => callback())
            }
        })
    }
    else {
        callback();
    }
};

/*
 * param: pageNumber (valid number for page of trusted users)
 * param: callback (callable function)
 * use: updates state to include a subsection of  
 *   meeting data conditions and sends either an error,
 *   response, or nothing to the callback upon completion 
 */
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

/*
 * param: callback (callable function)
 * use: makes an API call to retrieve the display name for
 *   from the login cookie stored on the device sends either
 *   an error or response to the callback upon completion 
 */
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

/*
 * param: fileId (string of characters)
 * param: token (string of characters)
 * param: callback (callable function)
 * use: makes an API call to retrieve a file's metadata
 *   with fileId as an ID and with token used to determine
 *   accessibility and sends either an error or response
 *   to the callback upon completion 
 */
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

/*
 * param: fileId (string of characters)
 * param: callback (callable function)
 * use: makes an API call to delete a file with
 *   fileId as an ID and sends either an error or response
 *   to the callback upon completion 
 */
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

/*
 * param: fileId (string of characters)
 * param: callback (callable function)
 * use: makes an API call to change the valid token
 *   for a file with fileId as an ID and sends either
 *   an error or response to the callback upon completion 
 */
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

/*
 * param: callback (callable function)
 * use: makes an API call to remove the current cookie
 *   for a logged in user and sends either an error
 *   or response to the callback upon completion 
 */
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

/*
 * param: file (a file object)
 * param: privacy (a string of characters)
 * param: trustedUsers (a JSON object)
 * param: comment (a string of characters)
 * param: callback (callable function)
 * use: makes an API call to upload file with the metadata
 *   privacy, trustedUsers, and comment and sends either
 *   an error or response to the callback upon completion 
 */
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

/*
 * param: database (IndexedDB database function)
 * param: fileId (string of characters)
 * param: token (string of characters)
 * param: callback (callable function)
 * use: checks if sent database contains file with matching
 *   fileId and either returns it or makes an API call to
 *   retrieve it using a token and stores it then sends
 *   either an error or file to the callback upon completion
 *   along with the db created from the database function 
 */
export function retrieveFile(database, fileId, token, callback=(() => { return })) {
    database(db => {
        let objectStore = db.transaction(DB_STORE_NAME).objectStore(DB_STORE_NAME);

        let req1 = objectStore.openCursor(fileId);
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
                        fileId: fileId,
                        token: token,
                    },
                    onDownloadProgress: (progressEvent) => {
                        this.setState({
                            fileDownloadProgress: Math.round((progressEvent.loaded * 100) / this.state.size)
                        });
                    }
                    })
                    .then(res => {
                        callback(null, res.data, db);
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

/*
 * param: fileId (a file object)
 * param: trustedUsers (a JSON object)
 * param: comment (a string of characters)
 * param: privacy (a string of characters)
 * param: callback (callable function)
 * use: makes an API call to update a file's metadata that
 *   has fileId as an ID with privacy, trustedUsers,
 *   and comment and sends either an error or response
 *   to the callback upon completion 
 */
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

/*
 * param: username (string of characters)
 * param: password (string of characters)
 * param: displayname (string of characters)
 * param: callback (callable function)
 * use: makes an API call to reister a user with the
 *  username, password, and displayname and sends
 *  either an error or response to the callback
 *  upon completion 
 */
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

/*
 * param: username (string of characters)
 * param: password (string of characters)
 * param: callback (callable function)
 * use: makes an API call to login a user with username
 *   and password, sets a cookie for future API calls, 
 *   and sends either an error or response to the
 *   callback upon completion 
 */
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