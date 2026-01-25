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
                console.log(envBuffer);
                console.log(respjson.envelopes[id]);
                const data = Uint8Array.from(atob(s.data), c => c.charCodeAt(0)).buffer;
                const aesKeyRaw = await crypto.subtle.decrypt({name: 'RSA-OAEP'}, state.prk, envBuffer);
                const aesKey = await crypto.subtle.importKey("raw", aesKeyRaw, {name: "AES-GCM"}, false, ['decrypt']);
                console.log(aesKey);
                const realIV = "IVB64"+state.user;
                console.log(realIV);
                const decryptedData = await crypto.subtle.decrypt(
                    { 
                    name: "AES-GCM", 
                    iv: Uint8Array.from(atob(localStorage.getItem(realIV)), c => c.charCodeAt(0)) 
                    }, 
                    aesKey, 
                    data);

                return {
                    ...s, data: new TextDecoder().decode(decryptedData), name: s.name, id: s.id
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
                            <li>
                                {s.name}: {s.data}
                            </li>
                        </div>
                    ))}
                </ul>
            </div>
        </>
     )
}

export default Vault;