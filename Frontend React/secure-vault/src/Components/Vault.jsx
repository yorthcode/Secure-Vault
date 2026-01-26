import { useState, useContext, useEffect } from "react";
import { AuthContext, useAuth } from "./Auth.jsx";
import Fetch from "./Fetch.jsx";

function Vault() {
    const [secrets, setSecrets] = useState([]);
    const [secretsDecrypted, setSecretsDecrypted] = useState([]);
    const [names, setNames] = useState([]);
    const [envelopes, setEnvelopes] = useState([]);
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
        }
        decrypt();
    }, [secrets, state]);

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
                                <button>Update</button>
                                <button style={{marginLeft: 'auto'}}>Delete</button>
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