import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Phone, AlertCircle } from 'lucide-react';
import type { UserRole } from '../types';
import { KENYAN_FACILITIES } from './CreateReferral';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const selectedRole = watch('role');

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as UserRole,
        phone: data.phone,
        facility: data.facility,
        department: data.department,
        preferredFacility: data.preferredFacility,
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
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
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
                    required: selectedRole === 'healthcare_provider' ? 'Facility is required for healthcare providers' : false 
                  })}
                  className="input-field"
                >
                  <option value="">Select your facility...</option>
                  {KENYAN_FACILITIES.map((facility) => (
                    <option key={facility} value={facility}>
                      {facility}
                    </option>
                  ))}
                </select>
                {errors.facility && (
                  <p className="mt-1 text-sm text-red-600">{errors.facility.message as string}</p>
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
                  placeholder="e.g., Pediatrics, Surgery, Emergency..."
                />
              </div>
            </>
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
                {KENYAN_FACILITIES.map((facility) => (
                  <option key={facility} value={facility}>
                    {facility}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Choose the healthcare facility you trust for your medical care and referrals
              </p>
              {errors.preferredFacility && (
                <p className="mt-1 text-sm text-red-600">{errors.preferredFacility.message as string}</p>
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

