import React from "react";
import ReactDOM from "react-dom/client";
import { 
    BrowserRouter,
    Routes,
    Route } from "react-router-dom";
import Home from "./Home.js";
import User from "./User.js";
import File from "./File.js";

const root = ReactDOM.createRoot(
    document.getElementById("root")
);

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