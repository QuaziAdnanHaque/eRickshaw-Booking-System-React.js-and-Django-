import "../styles/Styles.css";
import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Data {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const Register = () => {
  const [data, setData] = useState<Data>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const navigate = useNavigate();

  const valupd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    setError("");
    setSuccess("");
  };

  const submit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (data.password != data.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!data.role) {
      setError("Please select Customer or Driver.");
      return;
    }
    const registerData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
    };
    try {
      await axios.post(
        "http://127.0.0.1:3000/api/auth/register/",
        registerData,
      );
      setSuccess("Registration Successful!");
      setTimeout(async () => {
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
      }, 1000);
      setData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
    } catch (error: any) {
      if (error.response?.data) {
        setError(JSON.stringify(error.response.data));
      } else {
        setError("Registration failed.");
      }
      setData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Create Account</h1>
        <form onSubmit={submit}>
          <div className="form-group">
            <div className="role-toggle">
              <button
                type="button"
                className={data.role === "customer" ? "role-option active" : "role-option"}
                onClick={() => setData({ ...data, role: "customer" })}
              >
                Customer
              </button>
              <button
                type="button"
                className={data.role === "driver" ? "role-option active" : "role-option"}
                onClick={() => setData({ ...data, role: "driver" })}
              >
                Driver
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="John Doe"
              value={data.name}
              onChange={valupd}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="email@example.com"
              value={data.email}
              onChange={valupd}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              name="phone"
              placeholder="xxxxxxxxxx"
              maxLength={10}
              value={data.phone}
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
              minLength={8}
              value={data.password}
              onChange={valupd}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              minLength={8}
              value={data.confirmPassword}
              onChange={valupd}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>
        <p>Already have an account? <Link to="/login">Login</Link></p>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default Register;
