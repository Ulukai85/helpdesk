import { Routes, Route, Navigate } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path='/' element={<HomePage />} />
          <Route element={<AdminRoute />}>
            <Route path='/users' element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}
