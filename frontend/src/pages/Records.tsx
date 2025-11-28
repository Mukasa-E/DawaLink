import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { recordsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, ArrowRight } from 'lucide-react';
import type { MedicalRecord } from '../types';
import { format } from 'date-fns';

type RecordTypeFilter = 'all' | 'consultation' | 'test_result' | 'prescription' | 'diagnosis' | 'other';

export const Records: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RecordTypeFilter>('all');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await recordsAPI.getAll();
        setRecords(data);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.facilityName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || record.recordType === filterType;

    return matchesSearch && matchesFilter;
  });

  const recordTypeColor = {
    'consultation': 'bg-blue-100 text-blue-800 border-blue-200',
    'test_result': 'bg-purple-100 text-purple-800 border-purple-200',
    'prescription': 'bg-green-100 text-green-800 border-green-200',
    'diagnosis': 'bg-red-100 text-red-800 border-red-200',
    'other': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Medical Records
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'patient' ? 'Your medical history' : 'Patient medical records'}
          </p>
        </div>
        {user?.role === 'healthcare_provider' && (
          <Link
            to="/records/create"
            className="btn-primary flex items-center space-x-2 px-6 py-3 self-start md:self-auto"
          >
            <Plus size={20} />
            <span>New Record</span>
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="card border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, facility, or content..."
              className="input-field pl-10 py-3"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RecordTypeFilter)}
            className="input-field py-3 md:w-44"
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultation</option>
            <option value="test_result">Test Results</option>
            <option value="prescription">Prescription</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="card text-center py-12 border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="card text-center py-16 border border-gray-200">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">
            {searchQuery || filterType !== 'all'
              ? 'No records match your search'
              : 'No medical records yet'}
          </p>
          {user?.role === 'healthcare_provider' && !searchQuery && filterType === 'all' && (
            <Link
              to="/records/create"
              className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-block"
            >
              Create your first record →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((record) => (
            <Link
              key={record.id}
              to={`/records/${record.id}`}
              className="card border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {record.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        recordTypeColor[record.recordType as keyof typeof recordTypeColor] ||
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {record.recordType.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3 truncate-2">{record.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <span className="font-medium">Facility:</span>
                      <span>{record.facilityName}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <span className="font-medium">Provider:</span>
                      <span>{record.providerName}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <span className="font-medium">Date:</span>
                      <span>
                        {record.date 
                          ? format(new Date(record.date), 'MMM dd, yyyy')
                          : record.createdAt
                          ? format(new Date(record.createdAt), 'MMM dd, yyyy')
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0 ml-4" size={24} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{records.length}</p>
          </div>
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-blue-600 uppercase tracking-wide font-semibold">Consultation</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {records.filter((r) => r.recordType === 'consultation').length}
            </p>
          </div>
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-purple-600 uppercase tracking-wide font-semibold">Tests</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {records.filter((r) => r.recordType === 'test_result').length}
            </p>
          </div>
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-green-600 uppercase tracking-wide font-semibold">Prescription</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {records.filter((r) => r.recordType === 'prescription').length}
            </p>
          </div>
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-red-600 uppercase tracking-wide font-semibold">Diagnosis</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {records.filter((r) => r.recordType === 'diagnosis').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

