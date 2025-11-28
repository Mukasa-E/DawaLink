import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Referrals } from './pages/Referrals';
import { CreateReferral } from './pages/CreateReferral';
import { ReferralDetails } from './pages/ReferralDetails';
import { Records } from './pages/Records';
import { RecordDetails } from './pages/RecordDetails';
import { CreateRecord } from './pages/CreateRecord';
import { Patients } from './pages/Patients';
import { PatientDetails } from './pages/PatientDetails';
import { Admin } from './pages/Admin';
import { FacilityMedicines } from './pages/FacilityMedicines';
import SearchFacilities from './pages/SearchFacilities';
import FacilityDashboard from './pages/FacilityDashboard';
import ManageFacility from './pages/ManageFacility';
import PrescriptionsList from './pages/PrescriptionsList.tsx';
import PrescriptionCreate from './pages/PrescriptionCreate.tsx';
import OrdersList from './pages/OrdersList.tsx';
import FacilityOrders from './pages/FacilityOrders.tsx';
import OrderDetails from './pages/OrderDetails.tsx';
import { PendingProviders } from './pages/PendingProviders';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals"
        element={
          <ProtectedRoute>
            <Layout>
              <Referrals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/create"
        element={
          <ProtectedRoute allowedRoles={['healthcare_provider', 'admin']}>
            <Layout>
              <CreateReferral />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/referrals/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ReferralDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/records"
        element={
          <ProtectedRoute>
            <Layout>
              <Records />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/records/create"
        element={
          <ProtectedRoute allowedRoles={['healthcare_provider', 'admin']}>
            <Layout>
              <CreateRecord />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/records/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <RecordDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRoles={['healthcare_provider', 'admin']}>
            <Layout>
              <Patients />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <ProtectedRoute allowedRoles={['healthcare_provider', 'admin']}>
            <Layout>
              <PatientDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-medicines"
        element={
          <ProtectedRoute allowedRoles={['admin', 'healthcare_provider', 'facility_admin']}>
            <Layout>
              <FacilityMedicines />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <Layout>
              <PrescriptionsList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/create"
        element={
          <ProtectedRoute allowedRoles={['healthcare_provider','facility_admin']}>
            <Layout>
              <PrescriptionCreate />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['patient','admin','healthcare_provider']}>
            <Layout>
              <OrdersList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/facility"
        element={
          <ProtectedRoute allowedRoles={['facility_admin']}>
            <Layout>
              <FacilityOrders />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilities"
        element={
          <ProtectedRoute>
            <Layout>
              <SearchFacilities />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-facility"
        element={
          <ProtectedRoute allowedRoles={['facility_admin']}>
            <Layout>
              <ManageFacility />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending-providers"
        element={
          <ProtectedRoute allowedRoles={['facility_admin', 'admin']}>
            <Layout>
              <PendingProviders />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

