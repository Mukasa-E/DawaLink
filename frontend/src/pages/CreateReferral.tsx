import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { referralsAPI, patientsAPI, facilitiesAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Users, Building2, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { User, Facility } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Provider {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  licenseNumber?: string;
  department?: string;
  phone?: string;
}

export const CreateReferral: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [destinationProviders, setDestinationProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [selectedDestinationFacility, setSelectedDestinationFacility] = useState<string>('');
  const [userFacility, setUserFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Fetch registered facilities on mount
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await facilitiesAPI.getAll();
        setFacilities(data);
        
        // Set user's facility as referring facility
        if (user?.facilityId) {
          const userFac = data.find(f => f.id === user.facilityId);
          if (userFac) {
            setUserFacility(userFac);
          }
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      }
    };
    fetchFacilities();
  }, [user]);

  // Fetch providers when destination facility is selected
  useEffect(() => {
    const fetchProviders = async () => {
      if (selectedDestinationFacility) {
        try {
          const providers = await patientsAPI.getProvidersByFacility(selectedDestinationFacility);
          setDestinationProviders(providers);
        } catch (err) {
          console.error('Error fetching providers:', err);
          setDestinationProviders([]);
        }
      } else {
        setDestinationProviders([]);
      }
    };
    fetchProviders();
  }, [selectedDestinationFacility]);

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

    if (!user?.facilityId) {
      setError('You must be assigned to a facility to create referrals');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await referralsAPI.create({
        patientId: selectedPatient.id,
        patientAge: data.patientAge ? parseInt(data.patientAge) : undefined,
        patientGender: data.patientGender,
        referringFacilityId: user.facilityId, // Automatically use user's facility
        receivingFacilityId: data.receivingFacilityId,
        receivingProviderId: data.receivingProviderId || undefined,
        reason: data.reason,
        clinicalSummary: data.clinicalSummary,
        diagnosis: data.diagnosis,
        treatmentGiven: data.treatmentGiven,
        recommendations: data.recommendations,
        urgencyLevel: data.urgencyLevel || 'routine',
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

        {/* Referring From Facility */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="inline mr-2" size={18} />
            Referring From (Your Facility)
          </label>
          {userFacility ? (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-primary-900 text-lg">{userFacility.name}</p>
                  <p className="text-sm text-primary-700 mt-1">
                    {userFacility.type && `${userFacility.type} • `}
                    {userFacility.city}
                  </p>
                  {userFacility.address && (
                    <p className="text-xs text-primary-600 mt-1">{userFacility.address}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ You are not assigned to a facility. Please contact your administrator.
              </p>
            </div>
          )}
        </div>

        {/* Referring To Facility */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="inline mr-2" size={18} />
            Referring To (Destination Facility)
          </label>
          <select
            {...register('receivingFacilityId')}
            value={selectedDestinationFacility}
            onChange={(e) => setSelectedDestinationFacility(e.target.value)}
            className="input-field"
          >
            <option value="">Select destination facility (optional)...</option>
            {facilities
              .filter(f => f.id !== user?.facilityId) // Exclude user's own facility
              .map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} - {facility.city} ({facility.type})
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-gray-600">
            Select where you want to refer the patient to
          </p>
        </div>

        {/* Destination Providers */}
        {selectedDestinationFacility && destinationProviders.length > 0 && (
          <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Users className="inline mr-2" size={18} />
              Healthcare Providers at Destination ({destinationProviders.length} available)
            </label>
            <div className="space-y-2 mb-3">
              {destinationProviders.map((provider) => (
                <div 
                  key={provider.id} 
                  className="p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserIcon className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{provider.name}</p>
                        {provider.specialization && (
                          <p className="text-sm text-blue-600 font-medium">
                            {provider.specialization}
                          </p>
                        )}
                        {provider.department && (
                          <p className="text-xs text-gray-600">
                            Department: {provider.department}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{provider.email}</p>
                        {provider.phone && (
                          <p className="text-xs text-gray-500">{provider.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Specific Provider (Optional)
            </label>
            <select
              {...register('receivingProviderId')}
              className="input-field"
            >
              <option value="">Any available provider at the facility</option>
              {destinationProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - {provider.specialization || 'General'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-600">
              You can assign this referral to a specific provider, or leave it for any provider at the facility
            </p>
          </div>
        )}

        {selectedDestinationFacility && destinationProviders.length === 0 && (
          <div className="card bg-yellow-50 border border-yellow-200">
            <p className="text-yellow-800 text-sm">
              ℹ️ No healthcare providers registered at this facility yet. The referral will be available to any provider who joins.
            </p>
          </div>
        )}

        {/* Urgency Level */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urgency Level
          </label>
          <select {...register('urgencyLevel')} className="input-field">
            <option value="routine">Routine</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        {/* Reason */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Referral *
          </label>
          <textarea
            {...register('reason', { required: 'Reason is required' })}
            rows={3}
            className="input-field"
            placeholder="Why is this patient being referred?"
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message as string}</p>
          )}
        </div>

        {/* Clinical Summary */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Clinical Summary *
          </label>
          <textarea
            {...register('clinicalSummary', { required: 'Clinical summary is required' })}
            rows={4}
            className="input-field"
            placeholder="Provide a brief clinical summary of the patient's condition..."
          />
          {errors.clinicalSummary && (
            <p className="mt-1 text-sm text-red-600">{errors.clinicalSummary.message as string}</p>
          )}
        </div>

        {/* Diagnosis */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis
          </label>
          <textarea
            {...register('diagnosis')}
            rows={2}
            className="input-field"
            placeholder="Enter diagnosis (optional)..."
          />
        </div>

        {/* Treatment Given */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treatment Given
          </label>
          <textarea
            {...register('treatmentGiven')}
            rows={3}
            className="input-field"
            placeholder="What treatment has been provided so far? (optional)"
          />
        </div>

        {/* Recommendations */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recommendations
          </label>
          <textarea
            {...register('recommendations')}
            rows={3}
            className="input-field"
            placeholder="Any recommendations for the receiving facility (optional)..."
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

