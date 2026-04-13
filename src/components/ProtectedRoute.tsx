import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAppContext();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}
