import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Fetch from './Fetch.jsx';
import { AuthContext, useAuth } from './Auth.jsx';

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [disabled, setDisabled] = useState(false);
    const {state, dispatch} = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setDisabled(true);

        const enc = new TextEncoder();

        const passwordHash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(password)))));
        const data = {
            Username: username,
            PasswordEncrypted: passwordHash
        }
        const message = await Fetch('auth/login', 'POST', data);
        const response = await message.json();

        if (!message.ok) {
            alert(response.message);
            setDisabled(false);
            return;
        }
        else {
            dispatch({type: 'login', payload: {usern: username, userr: response.role }});
            alert(response.message);
            setDisabled(false);
            navigate('/vault');
        }
    }

    return (
        <>
            <div>
                <h2>Login</h2>      
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
                    <button type="submit" disabled={disabled}>Login</button>
                </form>
            </div>
        </>
    )

}

 export default LoginPage;