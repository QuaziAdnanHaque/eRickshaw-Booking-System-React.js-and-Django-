import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Landing from "../pages/Landing";
import CustomerDashboard from "../pages/CustomerDashboard";
import DriverDashboard from "../pages/DriverDashboard";

const Rules = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="register/" element={<Register />} />
          <Route path="login/" element={<Login />} />
          <Route path="customer/" element={<CustomerDashboard />} />
          <Route path="driver/" element={<DriverDashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Rules;
