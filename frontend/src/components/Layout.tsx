import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  UserPlus,
  Users,
  LogOut,
  Menu,
  X,
  Globe,
  ShoppingCart,
  Package,
  Truck,
  Store,
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: t('dashboard.title'), path: '/dashboard', icon: LayoutDashboard },
    
    // Medical records navigation (for patients, providers, admin)
    ...(user?.role === 'patient' || user?.role === 'healthcare_provider' || user?.role === 'admin'
      ? [
          { name: t('referrals.title'), path: '/referrals', icon: FileText },
          { name: t('records.title'), path: '/records', icon: FileText },
        ]
      : []),
    
    // Patient pharmacy navigation - Browse medicines and cart for patients
    ...(user?.role === 'patient'
      ? [
          { name: 'Browse Medicines', path: '/medicines', icon: Package },
          { name: 'Cart', path: '/cart', icon: ShoppingCart },
        ]
      : []),
    
    // Customer pharmacy navigation - Browse medicines and cart for customers
    ...(user?.role === 'customer'
      ? [
          { name: 'Browse Medicines', path: '/medicines', icon: Package },
          { name: 'Cart', path: '/cart', icon: ShoppingCart },
        ]
      : []),
    
    // Admin - Facility Medicines management (no cart)
    ...(user?.role === 'admin'
      ? [
          { name: 'Facility Medicines', path: '/facility-medicines', icon: Package },
        ]
      : []),
    
    // Pharmacy role navigation
    ...(user?.role === 'pharmacy'
      ? [
          { name: 'Pharmacy Dashboard', path: '/pharmacy/dashboard', icon: Store },
          { name: 'Inventory', path: '/pharmacy/inventory', icon: Package },
          { name: 'Orders', path: '/pharmacy/orders', icon: ShoppingCart },
        ]
      : []),
    
    // Delivery agent navigation
    ...(user?.role === 'delivery_agent'
      ? [
          { name: 'My Deliveries', path: '/delivery/dashboard', icon: Truck },
          { name: 'Assignments', path: '/delivery/assignments', icon: Package },
        ]
      : []),
    
    // Provider/Admin specific
    ...(user?.role === 'healthcare_provider' || user?.role === 'admin'
      ? [{ name: t('patients.title'), path: '/patients', icon: Users }]
      : []),
    
    // Healthcare provider facility medicines
    ...(user?.role === 'healthcare_provider'
      ? [{ name: 'Facility Medicines', path: '/facility-medicines', icon: Package }]
      : []),
    
    // Admin only
    ...(user?.role === 'admin'
      ? [{ name: t('admin.title'), path: '/admin', icon: UserPlus }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 lg:flex lg:items-stretch">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="text-xl font-bold text-primary-600">
            DawaLink
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:h-screen lg:overflow-y-auto`}
      >
        <div className="flex flex-col h-full lg:h-screen">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/dashboard" className="text-2xl font-bold text-primary-600">
              DawaLink
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              {t('common.welcome')}, {user?.name}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and actions */}
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Language selector */}
            <div className="flex items-center space-x-2">
              <Globe size={18} className="text-gray-500" />
              <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="en">{t('common.english')}</option>
                <option value="sw">{t('common.swahili')}</option>
              </select>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 pt-16 lg:pt-0">
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

