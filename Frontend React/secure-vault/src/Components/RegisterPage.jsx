import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Fetch from './Fetch.jsx'
import { AuthContext, useAuth } from './Auth.jsx';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [masterPassword, setMasterPassword] = useState('');
    const [registered, setRegistered] = useState(false);
    const {state, dispatch} = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (state.initialized && state.loggedIn) {
            navigate('/vault');
        }
    }, [state, navigate]);

    const generateMasterPassword = () => {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
            
        var master = masterPassword;
        if (!registered)
            master = generateMasterPassword();
        setMasterPassword(master);

        const KDFSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const KDFSaltHex = Array.from(KDFSalt).map(b => b.toString(16).padStart(2, '0')).join('');

        const Keys = await SetKeys(master, KDFSalt);

        const passwordHash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(password)))));

        const data =  {
            Username: username,
            PasswordEncrypted: passwordHash,
            KDFSalt: KDFSaltHex,
            PublicKey: btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)))
        }

        const message = await Fetch('user/register', 'POST', data);

        if (message.ok) {
            setRegistered(true);
            alert(message.message);
        }
        else {
            setRegistered(false);
            alert(message.message);
        }
    }

        return (
        <>        
            <div>
                <h2>Register</h2>      
            </div>
            <div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Username: 
                    </label>
                    <br />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required/>
                    <br />
                    <br />
                    <label>
                        Password: 
                    </label>
                    <br />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                    <br />
                    <br />
                    <button type="submit">Register</button>
                </form>
                <p>Already have an account? Log in <Link to="/login">here</Link></p>
                {registered ? (
                <div>
                    <p><strong>Your Master Password:</strong> {masterPassword}</p>
                    <p>Save this password securely. It will not be shown again!</p>
                </div>
                ) : <div /> }
            </div>
        </>
    )
}

 export default RegisterPage;