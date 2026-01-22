import { useEffect, createContext, useReducer } from 'react';

const InitialAuthContext = {
    initialized: false,
    loggedIn: false,
    jwt: null
}

function AuthStateReducer(state, action) {
    switch(action.type) {
        case 'initialize':{
            const jwtt = localStorage.getItem('jwt');
            return {
                ...state,
                initialized: true,
                loggedIn: !!jwtt,
                jwt: jwtt
            };
        }
        case 'login':
            return {
                ...state,
                loggedIn: true,
                jwt: action.payload.jwt
            };
        case 'logout':
            return {
                ...state,
                loggedIn: false,
                jwt: null
            }
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}
                
function useAuth() {
    const [state, dispatch] = useReducer(AuthStateReducer, InitialAuthContext);

    useEffect(() => {
        dispatch({ type: 'initialize' });
    }, []);

    return { state, dispatch };
}

export default useAuth;
export const AuthContext = createContext();