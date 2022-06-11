import React from "react";
import axios from "axios";
import { withWrapper } from "./comonentWrapper";
import "./style.css";

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};

        this.handleRegister = this.handleRegister.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
    }
    handleRegister() {
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;
        let navigate = this.props.navigate;

        if (!username.match(new RegExp(process.env.REACT_APP_USERNAME_VERIFICATION))) {
            this.setState({
                errorMessage: "Unable to register username"
            });
        }
        else if (!password.match(new RegExp(process.env.REACT_APP_PASSWORD_VERIFICATION))) {
            this.setState({
                errorMessage: "Unable to register password"
            });
        }
        else {         
            axios.post(SERVER_URL + process.env.REACT_APP_REGISTER_PATH, {
                    username: username,
                    password: password
                },
                {
                    withCredentials: true
                })
                .then(function(res) {
                    if (res.status === 204) {
                        navigate(process.env.REACT_APP_USER_PAGE);
                    }
                })
                .catch(function(err) {
                    console.error(err);
                });
        }
    }
    handleLogin() {
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;
        let navigate = this.props.navigate;

        axios.post(SERVER_URL + process.env.REACT_APP_LOGIN_PATH, {
                username: username,
                password: password
            },
            {
                withCredentials: true
            })
            .then(function(res) {
                if (res.status === 204) {
                    navigate(process.env.REACT_APP_USER_PAGE);
                }
            })
            .catch(function(err) {
                console.error(err);
            });
    }
    render() {
        console.log(SERVER_URL + process.env.REACT_APP_REGISTER_PATH)
        let errorMessage = this.state["errorMessage"] || null;
        return (
        <div className="login-form">
            {errorMessage !== null && <p id="message" className="error-message">{errorMessage}</p>}
            <input type="text" placeholder="username" id="username" />
            <input type="password" placeholder="password" id="password" />
            <button type="button" id="login-button" className="login-button" onClick={this.handleLogin}>Login</button>
            <button type="button" id="register-button" className="register-button" onClick={this.handleRegister}>Register Account</button>
        </div>
        );
    }
}

export default withWrapper(Home);