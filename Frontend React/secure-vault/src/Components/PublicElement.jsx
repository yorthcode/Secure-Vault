import { Navigate } from "react-router-dom";
import { AuthContext } from "./Auth.jsx";
import { useContext } from "react";

function PublicElement({children}) {
    const {state, dispatch} = useContext(AuthContext);
    if (!state.initialized)
        return null;

    return !state.loggedIn ? children : <Navigate to="/vault" replace />
}

export default PublicElement;