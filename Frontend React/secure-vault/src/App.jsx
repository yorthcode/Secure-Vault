import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Components/Layout.jsx'
import LoginPage from './Components/LoginPage.jsx'
import VaultPage from './Components/VaultPage.jsx'
import RegisterPage from './Components/RegisterPage.jsx'
import './App.css'
import NavigationBar from './Components/NavigationBar.jsx'
import { AuthContext, useAuth } from './Components/Auth.jsx'
import AddSecret from './Components/AddSecret.jsx'

function App() {
  const { state, dispatch } = useAuth();
  const [page, setPage] = useState("login");

  return (
    <>
    <AuthContext value={{ state, dispatch }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/addsecret" element={<AddSecret />} />
        </Route>

        <Route path="*" element={<div><NavigationBar /><div className='content'><h2>404 - Page not found</h2></div></div>} />
      </Routes>
    </AuthContext>
    </>
    
  )
}

export default App
