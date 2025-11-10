import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const raw = localStorage.getItem("wallet");
    const wallet = JSON.parse(raw); console.log(wallet.address);

    if (!raw) return <Navigate to="/login" replace />;

    try {
        const wallet = JSON.parse(raw);
        if (!wallet.address) return <Navigate to="/login" replace />;
    } catch {
        return <Navigate to="/login" replace />;
    }

    return children;
}
