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
import MedicineSearch from './pages/MedicineSearch';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import PharmacyDashboard from './pages/PharmacyDashboard';
import PharmacyInventory from './pages/PharmacyInventory';
import PharmacyOrders from './pages/PharmacyOrders';
import DeliveryDashboard from './pages/DeliveryDashboard';
import DeliveryAssignments from './pages/DeliveryAssignments';

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
          <ProtectedRoute allowedRoles={['admin', 'healthcare_provider']}>
            <Layout>
              <FacilityMedicines />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Pharmacy routes */}
      <Route
        path="/medicines"
        element={
          <ProtectedRoute>
            <Layout>
              <MedicineSearch />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Layout>
              <Cart />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute allowedRoles={['customer', 'admin']}>
            <Layout>
              <Checkout />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <OrderTracking />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/dashboard"
        element={
          <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
            <Layout>
              <PharmacyDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/inventory"
        element={
          <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
            <Layout>
              <PharmacyInventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/orders"
        element={
          <ProtectedRoute allowedRoles={['pharmacy', 'admin']}>
            <Layout>
              <PharmacyOrders />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Delivery routes */}
      <Route
        path="/delivery/dashboard"
        element={
          <ProtectedRoute allowedRoles={['delivery_agent', 'admin']}>
            <Layout>
              <DeliveryDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery/assignments"
        element={
          <ProtectedRoute allowedRoles={['delivery_agent', 'admin']}>
            <Layout>
              <DeliveryAssignments />
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

