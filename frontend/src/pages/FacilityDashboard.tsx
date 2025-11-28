import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { facilitiesAPI } from '../services/api';
import type { Facility } from '../types';
import { 
  Building2, 
  Package, 
  Users, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  TrendingUp
} from 'lucide-react';

const FacilityDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only fetch when auth is complete and user is available
    if (!authLoading && user) {
      loadFacility();
    } else if (!authLoading && !user) {
      // Auth complete but no user - stop loading
      setLoading(false);
    }
  }, [authLoading, user]);

  const loadFacility = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.facilityId) {
        setError('No facility ID found. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('Fetching facility with ID:', user.facilityId);
      const data = await facilitiesAPI.getById(user.facilityId);
      console.log('Facility data received:', data);
      setFacility(data);
    } catch (err: any) {
      console.error('Error loading facility:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Facility not found'}</p>
        </div>
      </div>
    );
  }

  const formatOperatingHours = (hours: any) => {
    if (!hours) return 'Not specified';
    if (typeof hours === 'string') return hours;
    if (hours.open && hours.close) {
      return `${hours.open} - ${hours.close}`;
    }
    return 'Not specified';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Building2 className="mr-3" size={32} />
              {facility.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your facility and services
            </p>
          </div>
          <button
            onClick={() => navigate('/my-facility')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="mr-2" size={18} />
            Edit Facility
          </button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {!facility.isVerified && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
              Verification Pending
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              Your facility is awaiting admin verification. You can still manage your facility and add medicines, 
              but you'll receive a verification badge once approved by our team.
            </p>
          </div>
        </div>
      )}

      {facility.isVerified && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">
              Verified Facility
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Your facility has been verified by our team. Patients can now find and trust your services.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Referrals Received</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {facility._count?.referralsTo || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
            <TrendingUp size={16} className="mr-1" />
            <span>View all referrals</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Medical Records</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {facility._count?.records || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Total records created</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Healthcare Providers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {facility._count?.users || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Registered providers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Medicines</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                --
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Package className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/facility-medicines')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Manage inventory →
            </button>
          </div>
        </div>
      </div>

      {/* Facility Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Facility Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Facility Type
            </h3>
            <p className="text-gray-900 dark:text-white capitalize">
              {facility.type.replace('_', ' ')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Registration Number
            </h3>
            <p className="text-gray-900 dark:text-white font-mono">
              {facility.registrationNumber}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <MapPin size={16} className="mr-1" />
              Address
            </h3>
            <p className="text-gray-900 dark:text-white">
              {facility.address}<br />
              {facility.city}{facility.county ? `, ${facility.county}` : ''}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <Phone size={16} className="mr-1" />
              Contact
            </h3>
            <p className="text-gray-900 dark:text-white">
              Phone: {facility.phone}<br />
              Email: {facility.email}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <Clock size={16} className="mr-1" />
              Operating Hours
            </h3>
            <p className="text-gray-900 dark:text-white">
              {formatOperatingHours(facility.operatingHours)}
            </p>
          </div>

          {facility.services && facility.services.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Services Offered
              </h3>
              <div className="flex flex-wrap gap-2">
                {facility.services.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/facility-medicines')}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
              Manage Medicines
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Add and manage your facility's medicine inventory
          </p>
        </button>

        <button
          onClick={() => navigate('/referrals')}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
              View Referrals
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Check referrals sent to your facility
          </p>
        </button>

        <button
          onClick={() => navigate('/my-facility')}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Edit className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="ml-4 text-lg font-semibold text-gray-900 dark:text-white">
              Update Details
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Edit your facility information and services
          </p>
        </button>
      </div>
    </div>
  );
};

export default FacilityDashboard;
