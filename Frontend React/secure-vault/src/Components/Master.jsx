import { useState, useContext } from "react";
import Fetch from "./Fetch.jsx";
import { AuthContext, useAuth } from "./Auth.jsx";

function Master() {
    const [masterPassword, setMasterPassword] = useState("");
    const {state, dispatch} = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (masterPassword === "") {
            alert("Please enter the master password.");
            return;
        }
        
        const response = await Fetch('user/getsalt', 'GET');
        const respjson = await response.json()

        const KDFSalt = new Uint8Array(respjson.salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

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


        const rawbytes = await crypto.subtle.exportKey('raw', aesKey);
        const rawkey = Array.from(new Uint8Array(rawbytes)).map(b => b.toString(16).padStart(2, '0')).join('');

        console.log("Derived AES Key:", rawkey);

        const iv = Uint8Array.from(atob(localStorage.getItem('IVB64')), c => c.charCodeAt(0));
        const epk = Uint8Array.from(atob(localStorage.getItem('EPKB64')), c => c.charCodeAt(0)).buffer;

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
    }

    return (
        <>
            <div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Master Password (can be changed):
                    </label>
                    <br />
                    <input type="password" value={masterPassword} onChange={(e) => setMasterPassword(e.target.value)} required/>
                    <br />
                    <br />
                    <button type="submit">Confirm</button>
                </form>
            </div>
        </>
    )
}

export default Master;