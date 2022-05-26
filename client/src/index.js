import React from "react";
import ReactDOM from "react-dom/client";
import { 
    BrowserRouter,
    Routes,
    Route } from "react-router-dom";
import Home from "./Home.js";
import User from "./User.js";
import File from "./File.js";

const DB_NAME = process.env.REACT_APP_IDB_NAME;
const DB_VERSION = process.env.REACT_APP_IDB_VERSION;
const DB_STORE_NAME = process.env.REACT_APP_IDB_STORE_NAME;

const root = ReactDOM.createRoot(
    document.getElementById("root")
);
let db = null;

if (window.indexedDB) {
    let request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = event => {
        console.error("Opening Database: " + event.target.errorCode);
    }
    request.onsuccess = event => {
        db = event.target.result;
        db.onerror = event => {
            console.error("Database error: " + event.target.errorCode);
        };
    }
    request.onupgradeneeded = event => {
        let store = event.currentTarget.result.createObjectStore(
            DB_STORE_NAME, { keyPath: "id", autoIncrement: true }
        );

        store.createIndex("fileId", "fileId", { unique: true });
        store.createIndex("filename", "filename", { unique: false });
        store.createIndex("mimetype", "mimetype", { unique: false });
        store.createIndex("blob", "blob", { unique: false });
    }
}

root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user" element={<User />} />
            <Route path="/file/:fileId" element={<File />} />
            <Route 
                path="*"
                element={
                    <main style={{ padding: "1rem" }}>
                        <p>Unable to find Route!</p>
                    </main>
                }
            />
        </Routes>
    </BrowserRouter>
);