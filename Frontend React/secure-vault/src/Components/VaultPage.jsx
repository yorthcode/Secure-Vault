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
    const [role, setRole] = useState(2);
    const [uname, setUname] = useState('');

    useEffect(() => {
        if (state.initialized == false || state.loggedIn == false) {
            navigate('/login');
            return;
        }

        if (state.prk != null && state.aes != null) {
            setUnlocked(true);
        }
    }, [state, navigate]);

    useEffect(() => {
        if (!state.user || state.user == "") {
            async function GetInfo() {
                const [unameRes, roleRes] = await Promise.all([Fetch("user/getuname", "GET"), Fetch("user/getrole", "GET")]);

                const uname = (await unameRes.json()).uname;
                const role = (await roleRes.json()).role;

                setRole(role);
                setUname(uname);
                dispatch({ type: 'addname', payload: { usern: uname } });
            }

            GetInfo();
        }
    }, [state, dispatch]);

    return (
        <>

            {unlocked ? (
                <>
                    <div>
                        <h2>Vault <br /> {(role != 2) ? (<><Link to="/addsecret">Add your secret</Link></>): (<></>)}</h2>
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