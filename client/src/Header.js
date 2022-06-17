import React from "react"
import {
    getDisplayName,
    logout
} from "./utils.js"
import { withWrapper } from "./componentWrapper";
import axios from "axios";
import $ from "jquery"

const SERVER_URL = process.env.REACT_APP_PROTOCOL
    + process.env.REACT_APP_DOMAIN;

class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dropdownState: "login"
        };

        this.getDisplayName = getDisplayName.bind(this);
        this.logout = logout.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.getCurrentDropdownHTML = this.getCurrentDropdownHTML.bind(this);
        this.handleRegister = this.handleRegister.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
    }

    componentDidMount() {
        this.getDisplayName(() => {
            if (this.state.displayname) this.setState({dropdownState: "logged-in"});
        });
        window.addEventListener("click", this.handleClick);
    }

    componentWillUnmount() {
        window.removeEventListener("click", this.handleClick);
    }

    handleClick(e) {
        if (e.target.matches(".login-dropdown-button")) {
            $("#login-dropdown").toggleClass("login-dropdown-display");
        }
        else if (!document.getElementById("login-dropdown").contains(e.target) && !$("#login-dropdown").hasClass("login-dropdown-display")) {
            $("#login-dropdown").toggleClass('login-dropdown-display');
        }
    }

    handleRegister() {
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;
        let displayname = document.getElementById("displayname").value;

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
                    password: password,
                    displayname: displayname
                },
                {
                    withCredentials: true
                })
                .then(res => {
                    this.props.navigate(process.env.REACT_APP_USER_PAGE);
                    if (!$("#login-dropdown").hasClass("login-dropdown-display")) {
                        $("#login-dropdown").toggleClass('login-dropdown-display');
                    }
                    this.getDisplayName();
                    this.setState({ dropdownState: "logged-in" });
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }

    handleLogin() {
        let username = document.getElementById("username").value;
        let password = document.getElementById("password").value;

        axios.post(SERVER_URL + process.env.REACT_APP_LOGIN_PATH, {
                username: username,
                password: password
            },
            {
                withCredentials: true
            })
            .then(res => {
                this.props.navigate(process.env.REACT_APP_USER_PAGE);
                if (!$("#login-dropdown").hasClass("login-dropdown-display")) {
                    $("#login-dropdown").toggleClass('login-dropdown-display');
                }
                this.getDisplayName();
                this.setState({ dropdownState: "logged-in" });
            })
            .catch(err => {
                console.error(err);
            });
    }

    getCurrentDropdownHTML() {
        if (this.state.dropdownState === "login") {
            return (
                <div className="login-form">
                    {this.state.errorMessage && <p id="message" className="error-message">{this.state.errorMessage || ""}</p>}
                    <input type="text" placeholder="Username" id="username" />
                    <input type="password" placeholder="Password" id="password" />
                    <button type="button" id="login-button" className="login-button" onClick={this.handleLogin}>Login</button>
                    <button type="button" id="register-button" className="register-button" onClick={() => this.setState({ dropdownState: "register" })}>Make An Account</button>
                </div>
            )
        }
        else if (this.state.dropdownState === "register") {
            return(
                <div className="login-form">
                    {this.state.errorMessage && <p id="message" className="error-message">{this.state.errorMessage || ""}</p>}
                    <input type="text" placeholder="Username" id="username" />
                    <input type="password" placeholder="Password" id="password" />
                    <input type="text" placeholder="Display Name" id="displayname" />
                    <button type="button" id="login-button" className="login-button" onClick={() => this.setState({ dropdownState: "login" })}>Back</button>
                    <button type="button" id="register-button" className="register-button" onClick={this.handleRegister}>Register</button>
                </div>
            )
        }
        else if (this.state.dropdownState === "logged-in") {
            return(
                <button type="button"
                        id="logout-button"
                        className="logout-button"
                        onClick={() => (this.logout(() => {
                            if (this.props.location.pathname !== "/") {
                                this.props.navigate("/");
                            }
                            if (!$("#login-dropdown").hasClass("login-dropdown-display")) {
                                $("#login-dropdown").toggleClass('login-dropdown-display');
                            }
                            this.getDisplayName();
                            this.setState({ dropdownState: "login" });
                        }))}
                        >Logout</button>
            )
        }
        else {
            <h1>WHAT DID YOU DO WROOONG</h1>
        }
    }

    render() {
        return(
            <div id="header" className="header">
                <button id="home-button"
                        className="home-button"
                        onClick = {() => {
                            if (this.props.location !== "/") {
                                this.props.navigate("/")
                            }
                        }}>Home</button>
                <div id="user-dropdown" className="user-dropdown">
                    <button id="user-display"
                            className="user-display"
                            onClick={() => {
                                if (this.props.location.pathname === "/") {
                                    this.props.navigate(process.env.REACT_APP_USER_PAGE)
                                }
                                else if (this.props.location.pathname !== "/user") {
                                    this.props.navigate(".." + process.env.REACT_APP_USER_PAGE);
                                }
                            }}>{this.state.displayname}</button>
                    <div>
                        <button type="button"
                                className="login-dropdown-button">{this.state.displayname ? "v" : "Sign In"}</button>
                        <div id="login-dropdown" className="login-dropdown login-dropdown-display">
                            {this.getCurrentDropdownHTML()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withWrapper(Header);