import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { patientsAPI, recordsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Search, User, FileText, Shield, ArrowUpRight, ArrowDownRight, Users, Calendar, Activity } from 'lucide-react';
import type { User as Patient } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface PatientWithReferrals extends Patient {
  referralCount: number;
  referredOut: number;
  referredIn: number;
  lastReferralDate: string;
  referrals: Array<{
    id: string;
    referralNumber: string;
    date: string;
    status: string;
    type: 'outgoing' | 'incoming';
    fromFacility: string;
    toFacility: string;
    urgencyLevel: string;
  }>;
}

export const Patients: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [myPatients, setMyPatients] = useState<PatientWithReferrals[]>([]);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'my-patients' | 'search'>('my-patients');

  useEffect(() => {
    loadMyPatients();
  }, []);

  const loadMyPatients = async () => {
    setLoading(true);
    try {
      const data = await patientsAPI.getMyPatients();
      setMyPatients(data);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;

    setSearchLoading(true);
    try {
      const results = await patientsAPI.search(searchQuery);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAuthorize = async (patientId: string) => {
    try {
      await patientsAPI.authorizeAccess(patientId, user?.id || '');
      alert('Access authorized successfully');
    } catch (error) {
      console.error('Error authorizing access:', error);
      alert('Failed to authorize access');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'accepted': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'text-red-600';
      case 'urgent': return 'text-orange-600';
      case 'routine': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('patients.title')}</h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'admin' 
            ? 'View all patients in the system'
            : 'View patients you\'ve treated through referrals and search for new patients'
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-patients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-patients'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users size={18} />
              <span>{user?.role === 'admin' ? 'All Patients' : 'My Patients'} ({myPatients.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Search size={18} />
              <span>Search Patients</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Search Bar */}
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
          <button type="submit" className="btn-primary px-6" disabled={searchLoading}>
            {searchLoading ? 'Searching...' : t('common.search')}
          </button>
        </form>
      </div>

      {/* My Patients Tab */}
      {activeTab === 'my-patients' && (
        <>
          {loading ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : myPatients.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {user?.role === 'admin' ? 'No patients registered yet' : 'No patients yet'}
              </h3>
              <p className="text-gray-600">
                {user?.role === 'admin' 
                  ? 'Registered patients will appear here'
                  : 'Patients you\'ve treated through referrals will appear here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPatients.map((patient) => (
                <div key={patient.id} className="card hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Patient Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-primary-50 rounded-lg">
                          <User className="text-primary-600" size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-600">{patient.email}</p>
                          {patient.phone && (
                            <p className="text-sm text-gray-600">{patient.phone}</p>
                          )}
                        </div>
                      </div>
                      <Link
                        to={`/patients/${patient.id}`}
                        className="btn-primary flex items-center space-x-2 px-4 py-2"
                      >
                        <FileText size={18} />
                        <span>View Details</span>
                      </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">
                          {patient.referralCount}
                        </div>
                        <div className="text-xs text-gray-600">Total Referrals</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <ArrowUpRight className="text-orange-600" size={20} />
                          <span className="text-2xl font-bold text-orange-600">
                            {patient.referredOut}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">Referred Out</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <ArrowDownRight className="text-green-600" size={20} />
                          <span className="text-2xl font-bold text-green-600">
                            {patient.referredIn}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">Received</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Calendar className="text-gray-600" size={16} />
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(patient.lastReferralDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">Last Referral</div>
                      </div>
                    </div>

                    {/* Recent Referrals */}
                    {patient.referrals && patient.referrals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Referrals</h4>
                        <div className="space-y-2">
                          {patient.referrals.slice(0, 3).map((referral) => (
                            <Link
                              key={referral.id}
                              to={`/referrals/${referral.id}`}
                              className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {referral.type === 'outgoing' ? (
                                    <ArrowUpRight className="text-orange-600" size={18} />
                                  ) : (
                                    <ArrowDownRight className="text-green-600" size={18} />
                                  )}
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900">
                                        {referral.referralNumber}
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(referral.status)}`}>
                                        {referral.status}
                                      </span>
                                      <Activity className={getUrgencyColor(referral.urgencyLevel)} size={14} />
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {referral.type === 'outgoing' 
                                        ? `To: ${referral.toFacility || 'Unspecified'}`
                                        : `From: ${referral.fromFacility}`
                                      }
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(referral.date), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {patient.referrals.length > 3 && (
                          <Link
                            to={`/patients/${patient.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                          >
                            View all {patient.referrals.length} referrals →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Search Results Tab */}
      {activeTab === 'search' && (
        <>
          {searchLoading ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="card text-center py-12">
              <User className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No patients found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((patient) => (
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
        </>
      )}
    </div>
  );
};

