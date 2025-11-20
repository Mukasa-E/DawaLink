import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { patientsAPI, recordsAPI } from '../services/api';
import { ArrowLeft, User, FileText, Mail, Phone, Building2, Calendar, Heart, Lock } from 'lucide-react';
import type { User as Patient, MedicalRecord } from '../types';
import { format } from 'date-fns';

export const PatientDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [patientData, recordsData] = await Promise.all([
          patientsAPI.getById(id),
          recordsAPI.getAll(id),
        ]);
        setPatient(patientData);
        setRecords(recordsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="card text-center py-12 border border-gray-200">
        <User className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">Patient not found</p>
        <Link to="/patients" className="text-primary-600 hover:text-primary-700 mt-4 inline-block font-medium">
          ← Back to Patients
        </Link>
      </div>
    );
  }

  const recordTypeColor = {
    'consultation': 'bg-blue-100 text-blue-800',
    'test_result': 'bg-purple-100 text-purple-800',
    'prescription': 'bg-green-100 text-green-800',
    'diagnosis': 'bg-red-100 text-red-800',
    'other': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/patients"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
          <p className="text-gray-600 mt-1">Complete patient information and medical history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Profile Card */}
          <div className="card border border-gray-200">
            <div className="flex items-start space-x-6 pb-6 border-b border-gray-100">
              <div className="p-4 bg-primary-50 rounded-lg flex-shrink-0">
                <User className="text-primary-600" size={40} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <p className="text-gray-600 mt-1">Patient ID: {patient.id}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Member since {format(new Date(patient.createdAt), 'MMMM yyyy')}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="flex items-center space-x-3">
                <Mail className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{patient.email}</p>
                </div>
              </div>
              {patient.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{patient.phone}</p>
                  </div>
                </div>
              )}
              {patient.facility && (
                <div className="flex items-center space-x-3">
                  <Building2 className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Primary Facility</p>
                    <p className="text-gray-900 font-medium">{patient.facility}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical Records */}
          <div className="card border border-gray-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Heart className="text-red-600" size={24} />
                  <span>Medical History</span>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {records.length} record{records.length !== 1 ? 's' : ''} on file
                </p>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-400 mb-3" size={40} />
                <p className="text-gray-600">No medical records found for this patient</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {records.map((record) => (
                  <Link
                    key={record.id}
                    to={`/records/${record.id}`}
                    className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:border-primary-200 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-primary-700">
                            {record.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              recordTypeColor[record.recordType as keyof typeof recordTypeColor] ||
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {record.recordType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate-2 mb-2">
                          {record.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{format(new Date(record.date), 'MMM dd, yyyy')}</span>
                          </span>
                          <span>{record.facilityName}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics Card */}
          <div className="card border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 uppercase font-semibold tracking-wide">Total Records</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{records.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 uppercase font-semibold tracking-wide">Active Status</p>
                <p className="text-lg font-bold text-green-900 mt-1">✓ Active</p>
              </div>
            </div>
          </div>

          {/* Record Type Distribution */}
          <div className="card border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Record Types</h3>
            <div className="space-y-2">
              {Object.entries(
                records.reduce((acc, record) => {
                  acc[record.recordType] = (acc[record.recordType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
              {records.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No records to analyze</p>
              )}
            </div>
          </div>

          {/* Access Control */}
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-100">
              <Lock className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-900">Data Security</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              All patient data is encrypted and access is controlled
            </p>
            <div className="flex items-center space-x-2 text-sm font-semibold text-green-700">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

