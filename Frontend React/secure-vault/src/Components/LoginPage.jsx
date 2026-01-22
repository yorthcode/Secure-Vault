import { useState } from 'react';
import Fetch from './Fetch.jsx';

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [masterPassword, setMasterPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        const enc = new TextEncoder();

        const passwordHash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(password)))));
        const data = {
            Username: username,
            PasswordEncrypted: passwordHash
        }
        const message = await Fetch('auth/login', 'POST', data);

        alert(message.message);

        if (!message.ok)
            return;

        setMasterPassword(localStorage.getItem('masterPassword'));

        const KDFSalt = Uint8Array.from(message.KDFSalt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        const material = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(masterPassword),
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

        const iv = Uint8Array.from(atob(localStorage.getItem('IVB64')), c => c.charCodeAt(0));
        const epk = Uint8Array.from(atob(localStorage.getItem('EPKB64')), c => c.charCodeAt(0));

        const privateKeyBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            aesKey,
            epk
        );

        const privateKey = await window.crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            false,
            ['decrypt']
        );
        
        
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
                    <button type="submit">Login</button>
                </form>
            </div>
        </>
    )

}

 export default LoginPage;