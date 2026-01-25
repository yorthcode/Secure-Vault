import { useEffect, createContext, useReducer } from 'react';
import Fetch from './Fetch.jsx';
import { useNavigate } from 'react-router-dom';

const InitialAuthContext = {
    initialized: false,
    loggedIn: false,
    aes: null,
    prk: null,
    user: null
}

function AuthStateReducer(state, action) {
    switch(action.type) {
        case 'initialize': 
                return {
                ...state,
                initialized: true,
                loggedIn: action.payload.loggedIn,
                user: action.payload.usern
            };
        case 'login':
            return {
                ...state,
                loggedIn: true,
                user: action.payload.usern
            };
        case 'logout':
            return {
                ...state,
                loggedIn: false,
                aes: null,
                prk: null,
                user: null
            }
        case 'update':
            return {
                ...state,
                aes: action.payload.aes,
                prk: action.payload.prk
            }
        case 'addname':
            return {
                ...state,
                user: action.payload.usern
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

            if (!message.ok)
            {
                const refresh = await Fetch('auth/refresh', 'GET');
                if (!refresh.ok)
                    dispatch({ type: 'initialize', payload: { loggedIn: false } });
                else {
                    dispatch({ type: 'initialize', payload: { loggedIn: true } });
                }
            }
            else if (message.ok) {
                dispatch({ type: 'initialize', payload: { loggedIn: true } });
            }
        }

        checkAuth();
    }, []);

    return { state, dispatch };
}

export const AuthContext = createContext();
export { useAuth };