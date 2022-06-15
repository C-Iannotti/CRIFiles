const DB_NAME = process.env.REACT_APP_IDB_NAME;
const DB_VERSION = process.env.REACT_APP_IDB_VERSION;
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

/*
 *Opens database and runs user's function
 *with this database
 *param: userFunction(function with one database parameter)
 *return: Error or null
 */
function useDatabase(userFunction) {
    if (window.indexedDB) {
        let request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = event => {
            console.error("Opening Database: " + event.target.errorCode);
        }
        request.onsuccess = event => {
            let db = event.target.result;
            userFunction(db);
            db.onerror = event => {
                console.error("Database error: " + event.target.errorCode);
            };
        }
        request.onupgradeneeded = event => {
            let store = event.currentTarget.result.createObjectStore(
                DB_STORE_NAME, { keyPath: "fileId" }
            );

            store.createIndex("blob", "blob", { unique: false });
        }
        return null;
    }
    else {
        return Error("Database not available for browser");
    }
}

export default useDatabase