import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Phone, AlertCircle, Building2, MapPin, Clock } from 'lucide-react';
import type { UserRole, FacilityType, Facility } from '../types';
import { facilitiesAPI } from '../services/api';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const selectedRole = watch('role');

  // Fetch facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await facilitiesAPI.getAll();
        setFacilities(data);
      } catch (err) {
        console.error('Error fetching facilities:', err);
      }
    };
    fetchFacilities();
  }, []);

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      // For healthcare providers, data.facility is the facilityId from the select value
      // For patients, data.preferredFacility is the facilityId
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as UserRole,
        phone: data.phone,
        facilityId: data.facility, // Send facilityId instead of facility name
        department: data.department,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        preferredFacility: data.preferredFacility,
        // Facility fields (for facility_admin)
        facilityName: data.facilityName,
        facilityType: data.facilityType,
        registrationNumber: data.registrationNumber,
        facilityPhone: data.facilityPhone,
        facilityEmail: data.facilityEmail,
        address: data.address,
        city: data.city,
        county: data.county,
        operatingHours: data.operatingHours,
        services: data.services,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">DawaLink</h1>
          <p className="text-gray-600">{t('auth.registerTitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.name')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="input-field pl-10"
                placeholder={t('common.name')}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="input-field pl-10"
                placeholder={t('common.email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                className="input-field pl-10"
                placeholder={t('common.password')}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.phone')}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                {...register('phone')}
                className="input-field pl-10"
                placeholder={t('common.phone')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.selectRole')}
            </label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="input-field"
            >
              <option value="">{t('auth.selectRole')}</option>
              <option value="patient">{t('auth.patient')}</option>
              <option value="healthcare_provider">{t('auth.healthcareProvider')}</option>
              <option value="facility_admin">Facility Owner/Admin</option>
              <option value="admin">{t('auth.admin')}</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
            )}
          </div>

          {(selectedRole === 'healthcare_provider' || selectedRole === 'admin') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Healthcare Facility *
                </label>
                <select
                  {...register('facility', { 
                    required: 'Please select the facility where you work'
                  })}
                  className="input-field"
                >
                  <option value="">Select your facility...</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name} - {facility.city}
                    </option>
                  ))}
                </select>
                {errors.facility && (
                  <p className="mt-1 text-sm text-red-600">{errors.facility.message as string}</p>
                )}
                {facilities.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Loading facilities...
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-600">
                  Select the facility where you are currently working
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization *
                </label>
                <input
                  type="text"
                  {...register('specialization', {
                    required: selectedRole === 'healthcare_provider' ? 'Specialization is required' : false
                  })}
                  className="input-field"
                  placeholder="e.g., Pediatrics, General Medicine, Surgery..."
                />
                {errors.specialization && (
                  <p className="mt-1 text-sm text-red-600">{errors.specialization.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  {...register('licenseNumber', {
                    required: selectedRole === 'healthcare_provider' ? 'License number is required' : false
                  })}
                  className="input-field"
                  placeholder="Medical license number..."
                />
                {errors.licenseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department (Optional)
                </label>
                <input
                  type="text"
                  {...register('department')}
                  className="input-field"
                  placeholder="e.g., Emergency, ICU, Outpatient..."
                />
              </div>
            </>
          )}

          {/* Facility Registration Fields */}
          {selectedRole === 'facility_admin' && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Building2 className="mr-2" size={20} />
                Facility Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Name *
                </label>
                <input
                  type="text"
                  {...register('facilityName', { 
                    required: 'Facility name is required' 
                  })}
                  className="input-field"
                  placeholder="e.g., Green Valley Clinic"
                />
                {errors.facilityName && (
                  <p className="mt-1 text-sm text-red-600">{errors.facilityName.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Type *
                </label>
                <select
                  {...register('facilityType', { 
                    required: 'Facility type is required' 
                  })}
                  className="input-field"
                >
                  <option value="">Select facility type...</option>
                  <option value="clinic">Clinic</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="hospital">Hospital</option>
                  <option value="health_center">Health Center</option>
                </select>
                {errors.facilityType && (
                  <p className="mt-1 text-sm text-red-600">{errors.facilityType.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  {...register('registrationNumber', { 
                    required: 'Registration number is required' 
                  })}
                  className="input-field"
                  placeholder="Official registration/license number"
                />
                {errors.registrationNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationNumber.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Phone *
                </label>
                <input
                  type="tel"
                  {...register('facilityPhone', { 
                    required: 'Facility phone is required' 
                  })}
                  className="input-field"
                  placeholder="+254..."
                />
                {errors.facilityPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.facilityPhone.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Email *
                </label>
                <input
                  type="email"
                  {...register('facilityEmail', { 
                    required: 'Facility email is required' 
                  })}
                  className="input-field"
                  placeholder="contact@facility.com"
                />
                {errors.facilityEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.facilityEmail.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  {...register('address', { 
                    required: 'Address is required' 
                  })}
                  className="input-field"
                  placeholder="Street address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    {...register('city', { 
                      required: 'City is required' 
                    })}
                    className="input-field"
                    placeholder="e.g., Nairobi"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    County
                  </label>
                  <input
                    type="text"
                    {...register('county')}
                    className="input-field"
                    placeholder="e.g., Nairobi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Hours
                </label>
                <input
                  type="text"
                  {...register('operatingHours')}
                  className="input-field"
                  placeholder="e.g., Mon-Fri 8:00 AM - 6:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services Offered (comma-separated)
                </label>
                <input
                  type="text"
                  {...register('services')}
                  className="input-field"
                  placeholder="e.g., General Consultation, Lab Tests, Vaccination"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Separate multiple services with commas
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'patient' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Healthcare Facility *
              </label>
              <select
                {...register('preferredFacility', { 
                  required: 'Please select your preferred healthcare facility' 
                })}
                className="input-field"
              >
                <option value="">Select your trusted facility...</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} - {facility.city}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the healthcare facility you trust for your medical care and referrals
              </p>
              {errors.preferredFacility && (
                <p className="mt-1 text-sm text-red-600">{errors.preferredFacility.message as string}</p>
              )}
              {facilities.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Loading facilities...
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg font-medium mt-6"
          >
            {loading ? 'Creating account...' : t('common.register')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              {t('common.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

