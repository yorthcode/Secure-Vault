import { useContext, useState } from "react";
import { AuthContext, useAuth } from "./Auth";

async function GetKeys(masterPassword, KDFSalt) {
    const {state, dispatch} = useContext(AuthContext);

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

    dispatch({ type: 'update', payload: { aes: aesKey, prk: privateKey } });
}

async function SetKeys(masterPassword, KDFSalt) {
    const {state, dispatch} = useContext(AuthContext);

    const enc = new TextEncoder();
        const material = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(masterPassword),
            { name: 'PBKDF2' },
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

        localStorage.setItem('EPKB64', EPKBase64);
        localStorage.setItem('IVB64', ivBase64);

        dispatch({ type: 'update', payload: { aes: aesKey, prk: exportedPrivateKey } });
}

export default { GetKeys, SetKeys };