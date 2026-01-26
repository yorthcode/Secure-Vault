import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Components/Layout.jsx'
import LoginPage from './Components/LoginPage.jsx'
import VaultPage from './Components/VaultPage.jsx'
import RegisterPage from './Components/RegisterPage.jsx'
import './App.css'
import NavigationBar from './Components/NavigationBar.jsx'
import { AuthContext, useAuth } from './Components/Auth.jsx'
import AddSecretPage from './Components/AddSecretPage.jsx'
import RequireAuth from './Components/RequireAuth.jsx'
import PublicElement from './Components/PublicElement.jsx'

function App() {
  const { state, dispatch } = useAuth();
  const [page, setPage] = useState("login");

  return (
    <>
    <AuthContext value={{ state, dispatch }}>
      <Routes>
        <Route element={<Layout />}>
          <Route element={<RequireAuth />}>
            <Route path="/addsecret" element={<AddSecretPage />} />
            <Route path="/vault" element={<VaultPage />} />
          </Route>
          <Route path="/register" element={<PublicElement> <RegisterPage /> </PublicElement>} />
          <Route path="/login" element={<PublicElement> <LoginPage /> </PublicElement>} />
          <Route path="/" element={<PublicElement> <Navigate to="/login" /> </PublicElement>} />
        </Route>

        <Route path="*" element={<div><NavigationBar /><div className='content'><h2>404 - Page not found</h2></div></div>} />
      </Routes>
    </AuthContext>
    </>
    
  )
}

export default App
