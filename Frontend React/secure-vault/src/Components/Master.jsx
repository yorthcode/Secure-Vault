import { useState, useContext } from "react";
import Fetch from "./Fetch.jsx";
import { AuthContext, useAuth } from "./Auth.jsx";

function Master({ success }) {
    const [masterPassword, setMasterPassword] = useState("");
    const {state, dispatch} = useContext(AuthContext);
    const [disabled, setDisabled] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (masterPassword === "") {
            alert("Please enter the master password.");
            return;
        }

        setDisabled(true);
        
        const response = await Fetch('user/getinfo', 'GET');
        const respjson = await response.json()

        const KDFSalt = new Uint8Array(respjson.salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        try {
        const enc = new TextEncoder();        
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

        const ivun = 'IVB64'+state.user;
        const epkun = 'EPKB64'+state.user;

        const iv = Uint8Array.from(atob(localStorage.getItem(ivun)), c => c.charCodeAt(0));
        const epk = Uint8Array.from(atob(localStorage.getItem(epkun)), c => c.charCodeAt(0)).buffer;

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

        dispatch({ type: 'update', payload: { aes: aesKey, prk: privateKey } });
        success();

        setDisabled(false);

        } catch (error) {
            alert("Invalid master password!");
            setDisabled(false);
        } 
    }

    return (
        <>
            <div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Master Password:
                    </label>
                    <br />
                    <input type="password" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} required/>
                    <br />
                    <br />
                    <button type="submit" disabled={disabled}>Confirm</button>
                </form>
            </div>
        </>
    )
}

export default Master;