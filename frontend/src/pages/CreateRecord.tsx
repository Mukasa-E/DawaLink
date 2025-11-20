import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { recordsAPI, patientsAPI } from '../services/api';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertCircle, Search } from 'lucide-react';
import type { User } from '../types';

export const CreateRecord: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      recordType: '',
      title: '',
      description: '',
    },
  });

  const recordType = watch('recordType');

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
      await recordsAPI.create({
        patientId: selectedPatient.id,
        recordType: data.recordType,
        title: data.title,
        description: data.description,
        date: new Date().toISOString(),
      });
      setSuccess(true);
      reset();
      setSelectedPatient(null);
      setSearchQuery('');
      setTimeout(() => navigate('/records'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/records"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Medical Record
          </h1>
          <p className="text-gray-600 mt-1">Add a new medical record for a patient</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="card bg-red-50 border border-red-200 flex items-start space-x-3 p-4">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="card bg-green-50 border border-green-200 p-4">
          <p className="text-green-700 font-semibold">✓ Record created successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="card border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient *
            </label>
            <p className="text-xs text-gray-600 mb-4">Search for a patient to add records to their file</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="input-field pl-10 py-3 text-base"
              />
            </div>
          </div>

          {selectedPatient ? (
            <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg flex items-start justify-between">
              <div>
                <p className="font-semibold text-primary-900">{selectedPatient.name}</p>
                <p className="text-sm text-primary-700">{selectedPatient.email}</p>
                {selectedPatient.phone && (
                  <p className="text-sm text-primary-700">{selectedPatient.phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setSearchQuery('');
                }}
                className="text-primary-700 hover:text-primary-900 font-semibold text-sm"
              >
                Change
              </button>
            </div>
          ) : null}

          {patients.length > 0 && !selectedPatient && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSearchQuery(patient.name);
                    setPatients([]);
                  }}
                  className="w-full text-left p-4 hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                </button>
              ))}
            </div>
          )}

          {searchQuery && patients.length === 0 && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-center text-gray-600 text-sm">
              No patients found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Record Details */}
        <div className="card border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Record Details</h2>

          {/* Record Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Type *
            </label>
            <select
              {...register('recordType', { required: 'Record type is required' })}
              className="input-field py-3"
            >
              <option value="">Select record type...</option>
              <option value="consultation">Consultation Notes</option>
              <option value="test_result">Test Results</option>
              <option value="prescription">Prescription</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="other">Other</option>
            </select>
            {errors.recordType && (
              <p className="mt-1 text-sm text-red-600">{errors.recordType.message as string}</p>
            )}
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 5, message: 'Title must be at least 5 characters' },
              })}
              className="input-field py-3"
              placeholder="e.g., Blood Test Results, Hypertension Check, Medication Review..."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message as string}</p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Details *
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' },
              })}
              rows={8}
              className="input-field py-3"
              placeholder="Enter detailed clinical information, findings, observations, or results..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Provide comprehensive information to create an accurate medical record
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={loading || isSubmitting || !selectedPatient}
            className="btn-primary flex items-center space-x-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            <span>{loading ? 'Creating Record...' : 'Create Record'}</span>
          </button>
          <Link to="/records" className="btn-secondary px-6 py-3">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

