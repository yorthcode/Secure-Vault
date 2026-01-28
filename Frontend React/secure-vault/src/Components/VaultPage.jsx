import Master from "./Master.jsx";
import { AuthContext, useAuth } from './Auth.jsx';
import { useContext, useEffect } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { useState } from "react";
import Vault from './Vault.jsx'
import Fetch from "./Fetch.jsx";

function VaultPage() {
    const {state, dispatch} = useContext(AuthContext);
    const navigate = useNavigate();
    const [unlocked, setUnlocked] = useState(false);

    useEffect(() => {
        if (state.prk != null && state.aes != null) {
            setUnlocked(true);
        }
    }, [state, navigate]);

    return (
        <>
            {unlocked ? (
                <>
                    <div>
                        <h2>Vault <br /> {(state.role != 2) ? (<><Link to="/addsecret">Add your secret</Link></>): (<></>)}</h2>
                    </div>
                    <Vault />
                </>
                ) : (
                <>
                    <div>
                        <h2>Vault</h2>
                    </div>
                    <Master success={() => setUnlocked(true)}/>
                </>
                )
            }
        </>
    )
}

 export default VaultPage;