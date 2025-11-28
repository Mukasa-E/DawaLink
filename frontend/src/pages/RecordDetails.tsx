import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { recordsAPI } from '../services/api';
import { ArrowLeft, Download, FileText, User, Building2, Calendar, Lock, Share2 } from 'lucide-react';
import type { MedicalRecord } from '../types';
import { format } from 'date-fns';

export const RecordDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      try {
        const data = await recordsAPI.getById(id);
        setRecord(data);
      } catch (error) {
        console.error('Error fetching record:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="card text-center py-12 border border-gray-200">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">Record not found</p>
        <Link to="/records" className="text-primary-600 hover:text-primary-700 mt-4 inline-block font-medium">
          ← Back to Records
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
          to="/records"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Record Details</h1>
          <p className="text-gray-600 mt-1">Complete medical record information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Record Header */}
          <div className="card border border-gray-200">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{record.title}</h2>
                <p className="text-gray-600 mt-1">Record ID: {record.id}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  recordTypeColor[record.recordType as keyof typeof recordTypeColor] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {record.recordType.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Facility
                </label>
                <p className="text-gray-900 mt-2 font-semibold">{record.facilityName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Provider
                </label>
                <p className="text-gray-900 mt-2 font-semibold">{record.providerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Date
                </label>
                <p className="text-gray-900 mt-2 font-semibold">
                  {record.date 
                    ? format(new Date(record.date), 'PPP')
                    : record.createdAt
                    ? format(new Date(record.createdAt), 'PPP')
                    : 'Date not available'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Access Status
                </label>
                <div className="flex items-center space-x-2 mt-2">
                  {record.isAuthorized ? (
                    <>
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-green-700 font-semibold">Authorized</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} className="text-yellow-600" />
                      <span className="text-yellow-700 font-semibold">Restricted</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Clinical Details</h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {record.description}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {record.attachments && record.attachments.length > 0 && (
            <div className="card border border-gray-200">
              <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Download className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
              </div>
              <div className="space-y-2">
                {record.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <Download className="text-gray-400 group-hover:text-primary-600" size={20} />
                      <span className="text-gray-900 font-medium">
                        Attachment {index + 1}
                      </span>
                    </div>
                    <span className="text-primary-600 group-hover:text-primary-700 font-semibold">
                      Download
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Information Card */}
          <div className="card border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Record Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building2 className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                    Facility
                  </p>
                  <p className="text-gray-900">{record.facilityName}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <User className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                    Provider
                  </p>
                  <p className="text-gray-900">{record.providerName}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="text-gray-400 mt-1 flex-shrink-0" size={18} />
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                    Date
                  </p>
                  <p className="text-gray-900">
                    {record.date 
                      ? format(new Date(record.date), 'PPP HH:mm')
                      : record.createdAt
                      ? format(new Date(record.createdAt), 'PPP HH:mm')
                      : 'Date not available'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Share & Permissions */}
          <div className="card border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Share2 size={20} className="text-primary-600" />
              <span>Access Control</span>
            </h3>
            <div className="space-y-3">
              <div
                className={`p-4 rounded-lg border ${
                  record.isAuthorized
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <p
                  className={`font-semibold ${
                    record.isAuthorized ? 'text-green-900' : 'text-yellow-900'
                  }`}
                >
                  {record.isAuthorized ? 'Authorized Access' : 'Restricted Access'}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    record.isAuthorized ? 'text-green-700' : 'text-yellow-700'
                  }`}
                >
                  {record.isAuthorized
                    ? 'This record is available to authorized providers'
                    : 'Access to this record is currently restricted'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

