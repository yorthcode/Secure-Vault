import Master from "./Master.jsx";
import { AuthContext, useAuth } from './Auth.jsx';
import { useContext, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function VaultPage() {
    const {state, dispatch} = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (state.loggedIn == false) {
            navigate('/login');
        }
    }, [state, navigate]);

    return (
        <>
            <div>
                <h2>Vault</h2>
            </div>
            <Master />
            
        </>
    )

}

 export default VaultPage;