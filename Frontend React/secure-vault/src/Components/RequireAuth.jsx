import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./Auth.jsx";
import { useContext } from "react";

function RequireAuth() {
    const {state, dispatch} = useContext(AuthContext);
    if (!state.initialized)
        return null;

    return state.loggedIn ? <Outlet /> : <Navigate to="/login" replace />
}

export default RequireAuth;