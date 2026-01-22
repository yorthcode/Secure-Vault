import { useEffect, createContext, useReducer } from 'react';
import Fetch from './Fetch.jsx';

const InitialAuthContext = {
    initialized: false,
    loggedIn: false,
    aes: null,
    prk: null
}

function AuthStateReducer(state, action) {
    switch(action.type) {
        case 'initialize': 
                return {
                ...state,
                initialized: true,
                loggedIn: action.payload.loggedIn
            };
        case 'login':
            return {
                ...state,
                loggedIn: true,
            };
        case 'logout':
            return {
                ...state,
                loggedIn: false,
                aes: null,
                prk: null
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

    useEffect(() => {
        
        async function checkAuth() {
            const message = await Fetch('auth/status', 'GET');

            if (!message.ok)
            {
                const refresh = await Fetch('auth/refresh', 'GET');
                if (!refresh.ok)
                    dispatch({ type: 'initialize', payload: { loggedIn: false } });
            }
            else if (message.ok)
                dispatch({ type: 'initialize', payload: { loggedIn: true } });
        }

        dispatch({ type: 'initialize', payload: { loggedIn: false } });
        checkAuth();
    }, []);

    return { state, dispatch };
}

export const AuthContext = createContext();
export { useAuth };