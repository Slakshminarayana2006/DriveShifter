import { useState } from 'react'
import './App.css'
import { Navigate, Route, Routes } from 'react-router'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import ProtectedRoute from './components/ProtectedRoute'
import Drive from './pages/Drive'
import DashboardLayout from './layouts/DashboardLayout'
import History from './pages/History'

function App() {

  return (
    <>
      <Routes>
        <Route element={<DashboardLayout/>}>
          <Route path='/' element={<Navigate to="/dashboard" replace />} />
          <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
          <Route path='/transfer' element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path='/drive' element={<ProtectedRoute><Drive /></ProtectedRoute>} />
          <Route path='/history' element={<ProtectedRoute><History /></ProtectedRoute>} />
        </Route>
          <Route path='/login' element={<Login />} />
      </Routes>
    </>
  )
}

export default App;
