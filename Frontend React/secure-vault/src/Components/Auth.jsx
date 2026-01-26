import { useEffect, createContext, useReducer } from 'react';
import Fetch from './Fetch.jsx';
import { useNavigate } from 'react-router-dom';

const InitialAuthContext = {
    initialized: false,
    loggedIn: false,
    aes: null,
    prk: null,
    user: null,
    role: null
}

function AuthStateReducer(state, action) {
    switch(action.type) {
        case 'initialize': 
                return {
                ...state,
                initialized: true,
                loggedIn: action.payload.loggedIn,
                user: action.payload.usern,
                role: action.payload.userr
            };
        case 'login':
            return {
                ...state,
                loggedIn: true,
                user: action.payload.usern,
                role: action.payload.userr
            };
        case 'logout':
            return {
                ...state,
                loggedIn: false,
                aes: null,
                prk: null,
                user: null,
                role: null
            }
        case 'update':
            return {
                ...state,
                aes: action.payload.aes,
                prk: action.payload.prk
            }
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}
                
function useAuth() {
    const [state, dispatch] = useReducer(AuthStateReducer, InitialAuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        
        async function checkAuth() {
            const message = await Fetch('auth/status', 'GET');
            if (!message.ok){
                dispatch({type: 'initialize', payload: { loggedIn: false}});
                return;
            }
            else {
                const msgjson = await message.json();
                dispatch({type: 'initialize', payload: { loggedIn: true, usern: msgjson.uname, userr: msgjson.role }});
            }
        }

        checkAuth();
    }, []);

    return { state, dispatch };
}

export const AuthContext = createContext();
export { useAuth };