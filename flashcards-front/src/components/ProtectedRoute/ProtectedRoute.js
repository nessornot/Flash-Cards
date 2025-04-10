import {Navigate, Outlet} from "react-router-dom";
import React from "react";

const ProtectedRoute = () => {
    const token = localStorage.getItem('jwtToken');
    return token ? <Outlet /> : <Navigate to="/login" />
};

export default ProtectedRoute;