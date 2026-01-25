import { useState, useEffect, useContext } from "react";
import { AuthContext, useAuth } from "./Auth.jsx";
import { useNavigate } from "react-router-dom";
import Fetch from "./Fetch.jsx";

function AddSecret() {
    const [secretName, setSecretName] = useState('');
    const [secretText, setSecretText] = useState('');
    const {state, dispatch} = useContext(AuthContext);
    const navigate = useNavigate();
    const [encData, setEncData] = useState();
    const [envelope, setEnvelope] = useState();

    useEffect(() => {
        if (state.initialized == false  || state.loggedIn == false) {
            navigate("/login");
        }
    }, [state, navigate])

    let cachedPublicKeys = null;

    async function GetPubKeys() {
        if (cachedPublicKeys) 
            return cachedPublicKeys;

        const response = await Fetch("user/getpubkeys", "GET");
        const { pubkeys, users } = await response.json();

         cachedPublicKeys = await Promise.all(
            pubkeys.map(async (pkBase64, idx) => {
                const bytes = Uint8Array.from(atob(pkBase64), c => c.charCodeAt(0));
                const cryptoKey = await crypto.subtle.importKey(
                    "spki",
                    bytes.buffer,
                    { name: "RSA-OAEP", hash: "SHA-256" },
                    true,
                    ["encrypt"]
                );
                return { user: users[idx], key: cryptoKey };
            })
        );

        return cachedPublicKeys;
    }
    const handleSubmit = async (e) => {
        e.preventDefault();

        const usersKeys = await GetPubKeys();

        const ivun = "IVB64"+state.user;
        const buffer = new TextEncoder().encode(secretText);
        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: Uint8Array.from(atob(localStorage.getItem(ivun)), c => c.charCodeAt(0))
            },
            state.aes,
            buffer
        );

        const rawAes = await crypto.subtle.exportKey(
            "raw",
            state.aes
        )

        const envelopes = await Promise.all(
            usersKeys.map(async ({ user, key }) => {
                const env = await crypto.subtle.encrypt(
                    { name: "RSA-OAEP" },
                    key,
                    rawAes
                );
                return { Username: user, Envelope: arrayBufferToBase64(env) };
            })
        );

        function arrayBufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        const data = {
            Name: secretName,
            Data: arrayBufferToBase64(encryptedData),
            Envelopes: envelopes
        }

        const response = await Fetch("secret/create", 'POST', data);
        const msg = await response.json();

        alert(msg.message);
        if (msg.ok) {
            //navigate("/vault");
        }
    }

    return (
        <>
            <div>
                <h2>Vault</h2>
            </div>
            <div>
                <form onSubmit={handleSubmit}>
                    <label>
                        Secret name:
                    </label>
                    <br />
                    <input type="text" value={secretName} onChange={(e) => setSecretName(e.target.value)} required />
                    <br />
                    <br />
                    <label>
                        Secret text:
                    </label>
                    <br />
                    <input type="text" value={secretText} onChange={(e) => setSecretText(e.target.value)} required />
                    <br />
                    <br />
                    <button type="submit">Create</button>
                </form>
            </div>
        </>
    )
}

export default AddSecret;