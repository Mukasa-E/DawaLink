import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { referralsAPI, patientsAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { User } from '../types';

// Major healthcare facilities in Kenya
export const KENYAN_FACILITIES = [
  'Kenyatta National Hospital - Nairobi',
  'Moi Teaching and Referral Hospital - Eldoret',
  'Kenyatta University Teaching, Referral and Research Hospital - Nairobi',
  'Aga Khan University Hospital - Nairobi',
  'Nairobi Hospital',
  'MP Shah Hospital - Nairobi',
  'Gertrude\'s Children\'s Hospital - Nairobi',
  'Avenue Healthcare - Kisumu',
  'Coptic Hospital - Nairobi',
  'Karen Hospital - Nairobi',
  'Huruma Nursing Home - Eldoret',
  'Mater Hospital - Nairobi',
  'Coast General Teaching and Referral Hospital - Mombasa',
  'Jaramogi Oginga Odinga Teaching and Referral Hospital - Kisumu',
  'Nakuru Level 5 Hospital',
  'Thika Level 5 Hospital',
  'Machakos Level 5 Hospital',
  'Kitale County Referral Hospital',
  'Kisii Teaching and Referral Hospital',
  'Embu Level 5 Hospital',
  'Nyeri County Referral Hospital',
  'Garissa County Referral Hospital',
  'Kakamega County General Hospital',
  'Bungoma County Referral Hospital',
  'Narok County Referral Hospital',
];

export const CreateReferral: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length >= 2) {
        try {
          const results = await patientsAPI.search(searchQuery);
          setPatients(results);
        } catch (error) {
          console.error('Error searching patients:', error);
        }
      } else {
        setPatients([]);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const onSubmit = async (data: any) => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await referralsAPI.create({
        patientId: selectedPatient.id,
        reason: data.reason,
        diagnosis: data.diagnosis,
        recommendations: data.recommendations,
        referredToFacility: data.referredToFacility,
        notes: data.notes,
      });
      navigate('/referrals');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create referral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/referrals"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('referrals.createReferral')}
          </h1>
          <p className="text-gray-600 mt-2">Create a new digital referral letter</p>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Search */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referrals.patientName')} *
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for patient..."
            className="input-field"
          />
          {selectedPatient && (
            <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="font-medium text-primary-900">{selectedPatient.name}</p>
              <p className="text-sm text-primary-700">{selectedPatient.email}</p>
            </div>
          )}
          {patients.length > 0 && !selectedPatient && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSearchQuery(patient.name);
                    setPatients([]);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referrals.reason')} *
          </label>
          <textarea
            {...register('reason', { required: 'Reason is required' })}
            rows={4}
            className="input-field"
            placeholder="Enter reason for referral..."
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message as string}</p>
          )}
        </div>

        {/* Diagnosis */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referrals.diagnosis')}
          </label>
          <textarea
            {...register('diagnosis')}
            rows={3}
            className="input-field"
            placeholder="Enter diagnosis (optional)..."
          />
        </div>

        {/* Recommendations */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referrals.recommendations')}
          </label>
          <textarea
            {...register('recommendations')}
            rows={3}
            className="input-field"
            placeholder="Enter recommendations (optional)..."
          />
        </div>

        {/* Referred To Facility */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referrals.referredToFacility')} *
          </label>
          <select
            {...register('referredToFacility', { required: 'Facility is required' })}
            className="input-field"
          >
            <option value="">Select a healthcare facility...</option>
            {KENYAN_FACILITIES.map((facility) => (
              <option key={facility} value={facility}>
                {facility}
              </option>
            ))}
          </select>
          {errors.referredToFacility && (
            <p className="mt-1 text-sm text-red-600">
              {errors.referredToFacility.message as string}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('referrals.notes')}
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="input-field"
            placeholder="Additional notes (optional)..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2 px-6 py-3"
          >
            <Save size={20} />
            <span>{loading ? 'Creating...' : t('common.save')}</span>
          </button>
          <Link to="/referrals" className="btn-secondary px-6 py-3">
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
};

