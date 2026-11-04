import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Student from './pages/student/Student';
import StudentEquipment from './pages/student/Equipment';
import Scan from './pages/student/Scan';
import MyTransactions from './pages/student/MyTransactions';
import EquipmentDetail from './pages/EquipmentDetail';
import Staff from './pages/staff/Staff';
import EquipmentManage from './pages/staff/EquipmentManage';
import QRLabels from './pages/staff/QRLabels';
import Requests from './pages/staff/Requests';
import Returns from './pages/staff/Returns';
import Maintenance from './pages/staff/Maintenance';
import History from './pages/staff/History';
import Alerts from './pages/Alerts';
import NotFound from './pages/NotFound';
import RoleRoute from './routes/RoleRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import { LoadingState } from './components/States';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px' }}>
        <LoadingState />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === 'staff' ? (
    <Navigate to="/staff" replace />
  ) : (
    <Navigate to="/student" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Logged-in routes wrapped in Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Student routes */}
          <Route
            path="/student"
            element={
              <RoleRoute allowedRoles={['student']}>
                <Student />
              </RoleRoute>
            }
          />
          <Route
            path="/student/equipment"
            element={
              <RoleRoute allowedRoles={['student']}>
                <StudentEquipment />
              </RoleRoute>
            }
          />
          <Route
            path="/student/scan"
            element={
              <RoleRoute allowedRoles={['student']}>
                <Scan />
              </RoleRoute>
            }
          />
          <Route
            path="/student/transactions"
            element={
              <RoleRoute allowedRoles={['student']}>
                <MyTransactions />
              </RoleRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route path="/equipment/:equipmentId" element={<EquipmentDetail />} />
          <Route path="/alerts" element={<Alerts />} />

          {/* Staff routes */}
          <Route
            path="/staff"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <Staff />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/equipment"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <EquipmentManage />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/qr-labels"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <QRLabels />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/requests"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <Requests />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/returns"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <Returns />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/maintenance"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <Maintenance />
              </RoleRoute>
            }
          />
          <Route
            path="/staff/history"
            element={
              <RoleRoute allowedRoles={['staff']}>
                <History />
              </RoleRoute>
            }
          />
        </Route>

        {/* 404 Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
