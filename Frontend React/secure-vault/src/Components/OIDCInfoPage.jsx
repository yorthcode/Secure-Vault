import { useContext, useEffect, useState } from "react";
import Fetch from "./Fetch";
import QRCode from "react-qr-code";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "./Auth";

function OIDCInfoPage() {
    const navigate = useNavigate();
    const [masterPassword, setMasterPassword] = useState('');
    const [OTPLink, setOTPLink] = useState('');
    const [show, setShow] = useState(false);
    const {state, dispatch} = useContext(AuthContext);

    useEffect(() => {
        const generateMasterPassword = () => {
            return Array.from(window.crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function getinfo() {
            const response = await Fetch("user/getinfo", 'GET');
            const respjson = await response.json();

            if (respjson.salt != "") {
                navigate("/vault");
                return;
            }

            setShow(true);

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

            const epkun = 'EPKB64'+state.user;
            const ivun = 'IVB64'+state.user;

            localStorage.setItem(epkun, EPKBase64);
            localStorage.setItem(ivun, ivBase64);
            
            const data =  {
                KDFSalt: KDFSaltHex,
                PublicKey: btoa(String.fromCharCode(...new Uint8Array(exportedPublicKey)))
            }

            const response1 = await Fetch("user/sendinfo", 'POST', data);
            const respjson1 = await response1.json();

            setOTPLink(`otpauth://totp/Secure-Vault:${state.user}?secret=${respjson1.totp}&issuer=Secure-Vault&digits=6`);
            setMasterPassword(master);
        }
        getinfo();
    }, [state])


    return (
        <>
        {show ? (
            <div>
                <p><strong>Your Master Password and Authenticator code:</strong></p> 
                <p>{masterPassword}</p>
                <p><QRCode value={OTPLink} className='QRCode'/></p>
                <p>Save this infomration securely. It will never be shown again!</p>
            </div>) : 
            (<div />)}
            
            
        </>
    )
}

export default OIDCInfoPage;