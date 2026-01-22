import { Link } from 'react-router-dom'

function NavigationBar() {
  return (
    <div className='navBar'>
        <div className='appName'>
            Secure Vault
        </div>
        <div className='links'>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/vault">Vault</Link>
        </div>
    </div>
  )
}

export default NavigationBar;