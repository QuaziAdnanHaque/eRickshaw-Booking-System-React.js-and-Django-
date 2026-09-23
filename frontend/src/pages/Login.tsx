import "../styles/Styles.css";
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Data {
    email: string;
    password: string;
}

const Login = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<Data>({ email: "", password: "" });
    const [error, setError] = useState<string>("");

    const valupd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
        setError("");
    };

    const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axios.post("http://127.0.0.1:3000/api/auth/login/", data);
            const accessToken = response.data.access;
            const refreshToken = response.data.refresh;
            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("refresh_token", refreshToken);
            const userResponse = await axios.get("http://127.0.0.1:3000/api/auth/me/", {
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem("access_token")
                }
            });
            const user = userResponse.data;
            localStorage.setItem("user", JSON.stringify(user));
            if (user.role == "driver") {
                navigate("/driver");
            } else {
                navigate("/customer");
            }
        } catch (error: any) {
            console.log(error.response?.data);
            setError("Invalid email or password.");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h1>Login</h1>
                {error && <p className="error">{error}</p>}
                <form onSubmit={submit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            placeholder="email@example.com"
                            value={data.email}
                            onChange={valupd}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            value={data.password}
                            onChange={valupd}
                            required
                        />
                    </div>
                    <button>Login</button>
                </form>
                <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div>
        </div>
    );
};

export default Login;