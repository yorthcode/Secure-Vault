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

        setRegistered(false);
            
        const master = generateMasterPassword();

        const KDFSalt = window.crypto.getRandomValues(new Uint8Array(16));
        const KDFSaltHex = Array.from(KDFSalt).map(b => b.toString(16).padStart(2, '0')).join('');

        const enc = new TextEncoder();

        const material = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(master),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        const aesKey = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: KDFSalt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            material,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        
        const rawbytes = await crypto.subtle.exportKey('raw', aesKey);
        const rawkey = Array.from(new Uint8Array(rawbytes)).map(b => b.toString(16).padStart(2, '0')).join('');

        console.log("Derived AES Key:", rawkey);

        const rsaKeys = await window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );

        const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', rsaKeys.privateKey);
        const exportedPublicKey = await window.crypto.subtle.exportKey('spki', rsaKeys.publicKey);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedPrivateKey = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            aesKey,
            exportedPrivateKey
        );

        const EPKBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedPrivateKey)));
        const ivBase64 = btoa(String.fromCharCode(...iv));

        localStorage.setItem('EPKB64', EPKBase64);
        localStorage.setItem('IVB64', ivBase64);
        
        const passwordHash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(password)))));

        const data =  {
            Username: username,
            PasswordEncrypted: passwordHash,
            KDFSalt: KDFSaltHex,
            PublicKey: btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)))
        }

        setMasterPassword(master);

        const message = await Fetch('user/register', 'POST', data);
        const response = await message.json();

        if (message.ok) {
            setRegistered(true);
            alert(response.message);
        }
        else {
            setRegistered(false);
            alert(response.message);
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