import { useState, useContext, useEffect } from "react";
import { AuthContext, useAuth } from "./Auth.jsx";
import Fetch from "./Fetch.jsx";

function Vault() {
    const [secretChanged, setSecretChanged] = useState(false);
    const [secretsDecrypted, setSecretsDecrypted] = useState([]);
    const { state, dispatch } = useContext(AuthContext);

    useEffect(() => {
        async function decrypt() {
            const response = await Fetch('secret/getall', 'GET');
            const respjson = await response.json();

            const decrypted = await Promise.all(respjson.secrets.map(async (s, id) => {

                const envBuffer = Uint8Array.from(atob(respjson.envelopes[id]), c => c.charCodeAt(0)).buffer

                const data = Uint8Array.from(atob(s.data), c => c.charCodeAt(0)).buffer;

                const aesKeyRaw = await crypto.subtle.decrypt({name: 'RSA-OAEP'}, state.prk, envBuffer);
                const aesKey = await crypto.subtle.importKey("raw", aesKeyRaw, {name: "AES-GCM"}, false, ['decrypt']);

                const IV = Uint8Array.from(atob(s.iv), c => c.charCodeAt(0));

                const decryptedData = await crypto.subtle.decrypt(
                    { 
                    name: "AES-GCM", 
                    iv: IV
                    }, 
                    aesKey, 
                    data);

                    const isowner = (s.usernameOwner == state.user);

                return {
                    ...s, data: new TextDecoder().decode(decryptedData), name: s.name, id: s.id, ownername: s.usernameOwner, isowner: isowner
                }
            }));

            setSecretsDecrypted(decrypted);
            setSecretChanged(false);
        }
        decrypt();
    }, [state, secretChanged]);

    const handleUpdate = async (name, data) => {
        function arrayBufferToBase64(buffer) {
            const bytes = new Uint8Array(buffer);
            let binary = "";
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        const updated = prompt("Enter the updated secret text", data);

        const ivun = "IVB64"+state.user;
        const buffer = new TextEncoder().encode(updated);

        const encUpdData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: Uint8Array.from(atob(localStorage.getItem(ivun)), c => c.charCodeAt(0))
            },
            state.aes,
            buffer
        );

        const updData = {
            UsernameOwner: state.user,
            Name: name,
            Data: arrayBufferToBase64(encUpdData)
        };

        const updateresp = await Fetch("secret/update", 'POST', updData);
        const updrespjson = await updateresp.json();
        
        alert (updrespjson.message);
        setSecretChanged(true);
    }

    const handleDelete = async (name) => {
        const deleted = confirm("Are you sure you want to delete this secret?");
        if (deleted) {
            const delData = {
                Name: name,
                UsernameOwner: state.user
            };

            const resp = await Fetch("secret/delete", 'DELETE', delData);
            const respjson = await resp.json();

            alert(respjson.message);
            setSecretChanged(true);
        }
            
    }

     return (
        <>
            <div className="card">
                There are {secretsDecrypted.length} secrets shared with you!
                <ul>
                    {secretsDecrypted.map(s => (
                        <div className="card" key={s.id}>
                            <h3><b>Secret "{s.name}" from: {s.ownername}</b></h3>
                            {s.data}
                            <div style={{display: 'flex'}}>
                                {s.isowner ? (<>
                                <button onClick={() => handleUpdate(s.name, s.data)}>Update</button>
                                <button style={{marginLeft: 'auto'}} onClick={() => handleDelete(s.name)}>Delete</button>
                                </>) : null}
                            </div>
                        </div>
                    ))}
                </ul>
            </div>
        </>
     )
}

export default Vault;