import { useState } from "react";
import GetKeys from "./Keys.jsx";
import Fetch from "./Fetch.jsx";

function Master() {
    const [masterPassword, setMasterPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (masterPassword === "") {
            alert("Please enter the master password.");
            return;
        }
        const response = await Fetch('user/getsalt', 'GET');
        const respjson = await response.json()

        const KDFSalt = new Uint8Array(respjson.KDFSalt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        const Keys = await GetKeys(masterPassword, KDFSalt);
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