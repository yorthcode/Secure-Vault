import { Link } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react';
import { AuthContext, useAuth } from './Auth.jsx';
import Fetch from './Fetch.jsx';

function NavigationBar() {
    const {state, dispatch} = useContext(AuthContext);

    const logout = async () => {
        dispatch({ type: 'logout' });
        await Fetch('auth/logout', 'POST');
    }

  return (
    <div className='navBar'>
      { state.initialized == false ? (
        <>
          <div className='appName'>
            Secure Vault
        </div> 
        </>
      ) : (
        <>
          <div className='appName'>
              Secure Vault
          </div>  
          <div>
            {state.loggedIn == true ? (
              <div className='links'>
               Signed in as {state.user}
              <Link to="/vault">Vault</Link>
              <Link to="/login" onClick={logout}>Logout</Link>
              </div>
            ) : (
              <div className='links'>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
              </div>
            )}
          </div>
        </>)}
    </div>
  )
}

export default NavigationBar;