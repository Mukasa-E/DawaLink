import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { patientsAPI, recordsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Search, User, FileText, Shield } from 'lucide-react';
import type { User as Patient } from '../types';

export const Patients: React.FC = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;

    setLoading(true);
    try {
      const results = await patientsAPI.search(searchQuery);
      setPatients(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async (patientId: string) => {
    try {
      // In a real app, this would use the current provider's ID
      await patientsAPI.authorizeAccess(patientId, 'current-provider-id');
      alert('Access authorized successfully');
    } catch (error) {
      console.error('Error authorizing access:', error);
      alert('Failed to authorize access');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('patients.title')}</h1>
        <p className="text-gray-600 mt-2">{t('patients.searchPatients')}</p>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary px-6">
            {t('common.search')}
          </button>
        </form>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : patients.length === 0 && searchQuery ? (
        <div className="card text-center py-12">
          <User className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No patients found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {patients.map((patient) => (
            <div key={patient.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <User className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.email}</p>
                      {patient.phone && (
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/patients/${patient.id}`}
                    className="btn-secondary flex items-center space-x-2 px-4 py-2"
                  >
                    <FileText size={18} />
                    <span>{t('patients.patientDetails')}</span>
                  </Link>
                  <button
                    onClick={() => handleAuthorize(patient.id)}
                    className="btn-primary flex items-center space-x-2 px-4 py-2"
                  >
                    <Shield size={18} />
                    <span>{t('patients.authorizeAccess')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

