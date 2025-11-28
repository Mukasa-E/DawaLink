import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { referralsAPI, recordsAPI, adminAPI } from '../services/api';
import { Link } from 'react-router-dom';
import {
  FileText,
  Activity,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
} from 'lucide-react';
import type { Referral, MedicalRecord } from '../types';
import { format } from 'date-fns';
import FacilityDashboard from './FacilityDashboard';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If user is facility_admin, show facility-specific dashboard
  if (user?.role === 'facility_admin') {
    return <FacilityDashboard />;
  }

  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if still checking auth or user not logged in
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        const [referralsData, recordsData] = await Promise.all([
          referralsAPI.getAll(),
          recordsAPI.getAll(),
        ]);
        setReferrals(referralsData);
        setRecords(recordsData);

        if (user?.role === 'admin') {
          const stats = await adminAPI.getStats();
          setAdminStats(stats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // Calculate statistics
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
  const completedReferrals = referrals.filter((r) => r.status === 'completed').length;
  const recentRecords = records.slice(0, 5);
  const recentReferrals = referrals.slice(0, 5);

  // Role-specific stats
  const getStats = () => {
    const baseStats = [
      {
        name: t('referrals.title'),
        value: referrals.length,
        icon: FileText,
        color: 'text-blue-600 bg-blue-50',
        link: '/referrals',
      },
      {
        name: t('records.title'),
        value: records.length,
        icon: Activity,
        color: 'text-green-600 bg-green-50',
        link: '/records',
      },
    ];

    if (user?.role === 'admin') {
      baseStats.push(
        {
          name: t('admin.totalUsers'),
          value: adminStats?.totalUsers || 0,
          icon: Users,
          color: 'text-purple-600 bg-purple-50',
          link: '/admin',
        },
        {
          name: t('admin.activeFacilities'),
          value: adminStats?.activeFacilities || 0,
          icon: Building2,
          color: 'text-orange-600 bg-orange-50',
          link: '/admin',
        }
      );
    }

    if (user?.role === 'healthcare_provider') {
      baseStats.push({
        name: 'Pending Referrals',
        value: pendingReferrals,
        icon: Clock,
        color: 'text-yellow-600 bg-yellow-50',
        link: '/referrals',
      });
    }

    return baseStats;
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            {user?.role === 'patient' ? '👋 ' : ''}
            {t('dashboard.welcome')}, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-primary-100 text-lg mt-2">
            {user?.role === 'patient' 
              ? '✨ Your health journey, all in one place' 
              : t('dashboard.overview')
            }
          </p>
          <p className="text-sm text-primary-200 mt-3 flex items-center space-x-2">
            <Clock size={16} />
            <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </p>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-white opacity-5"></div>
      </div>

      {/* Patient Quick Info Card */}
      {user?.role === 'patient' && user?.preferredFacility && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <Building2 className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Your Trusted Healthcare Facility</p>
              <p className="text-xl font-bold text-blue-900 mt-1">{user.preferredFacility}</p>
              <p className="text-xs text-gray-500 mt-1">Where you receive your primary care</p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Health Summary Cards */}
      {user?.role === 'patient' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                <Activity className="text-green-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-green-900">{records.length}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Medical Records</h3>
            <p className="text-xs text-gray-600 mt-1">Total health records</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="text-purple-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-purple-900">{referrals.length}</span>
            </div>
            <h3 className="font-semibold text-gray-900">Referrals</h3>
            <p className="text-xs text-gray-600 mt-1">Total referrals received</p>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="text-orange-600" size={24} />
              </div>
              <span className="text-3xl font-bold text-orange-900">
                {records.filter(r => r.recordType === 'consultation').length}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">Consultations</h3>
            <p className="text-xs text-gray-600 mt-1">Doctor visits</p>
          </div>
        </div>
      )}

      {/* Quick Actions for Providers */}
      {user?.role === 'healthcare_provider' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/referrals/create"
            className="card hover:shadow-lg transition-all duration-300 hover:border-primary-200 border border-gray-200 flex items-center space-x-4 group"
          >
            <div className="p-4 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
              <Plus className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Referral</h3>
              <p className="text-sm text-gray-600">Issue a digital referral</p>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-primary-600 transition-colors ml-auto" />
          </Link>

          <Link
            to="/records/create"
            className="card hover:shadow-lg transition-all duration-300 hover:border-primary-200 border border-gray-200 flex items-center space-x-4 group"
          >
            <div className="p-4 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <FileText className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Record</h3>
              <p className="text-sm text-gray-600">Add patient record</p>
            </div>
            <ArrowRight className="text-gray-400 group-hover:text-green-600 transition-colors ml-auto" />
          </Link>
        </div>
      )}

      {/* Stats Grid - Hide for patients */}
      {user?.role !== 'patient' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                to={stat.link}
                className="card hover:shadow-lg transition-all duration-300 group hover:border-primary-200 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 font-medium uppercase tracking-wide">
                      {stat.name}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 group-hover:text-primary-600 transition-colors">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${stat.color} group-hover:shadow-lg transition-all duration-300`}
                  >
                    <Icon size={24} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Provider Metrics */}
      {user?.role === 'healthcare_provider' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card border border-gray-200 hover:border-primary-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{completedReferrals}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {referrals.length > 0
                    ? Math.round((completedReferrals / referrals.length) * 100)
                    : 0}
                  % completion rate
                </p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="card border border-gray-200 hover:border-yellow-200 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Actions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingReferrals}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Require follow-up
                </p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Referrals - Hide for patients */}
      {user?.role !== 'patient' && (
        <div className="card border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('dashboard.recentReferrals')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Latest patient referrals</p>
            </div>
            <Link
              to="/referrals"
              className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm font-medium hover:underline"
            >
              <span>{t('common.viewAll') || 'View All'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {recentReferrals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600">{t('referrals.noReferrals') || 'No referrals found'}</p>
              {user?.role === 'healthcare_provider' && (
                <Link
                  to="/referrals/create"
                  className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
                >
                  Create your first referral →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentReferrals.map((referral) => (
                <Link
                  key={referral.id}
                  to={`/referrals/${referral.id}`}
                  className="p-4 border border-gray-100 rounded-lg hover:bg-primary-50 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-700">
                          {referral.patientName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : referral.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : referral.status === 'accepted'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {referral.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{referral.reason}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {format(new Date(referral.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Records */}
      <div className="card border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              {user?.role === 'patient' ? (
                <>
                  <Activity className="text-primary-600" size={28} />
                  <span>Your Medical Records</span>
                </>
              ) : (
                <span>{t('dashboard.recentRecords')}</span>
              )}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {user?.role === 'patient' 
                ? '📋 Complete history of your healthcare journey' 
                : 'Latest medical records'
              }
            </p>
          </div>
          <Link
            to="/records"
            className="btn-primary flex items-center space-x-2 px-4 py-2"
          >
            <span>{t('common.viewAll') || 'View All'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-4">
              <Activity className="text-gray-400" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Medical Records Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {user?.role === 'patient' 
                ? 'Your healthcare providers will add records as you receive care. All your medical information will appear here for easy access.' 
                : 'No records found'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRecords.map((record) => {
              // Define colors for different record types
              const getRecordTypeColor = (type: string) => {
                switch(type) {
                  case 'consultation': return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'test_result': return 'bg-purple-100 text-purple-800 border-purple-200';
                  case 'prescription': return 'bg-green-100 text-green-800 border-green-200';
                  case 'diagnosis': return 'bg-red-100 text-red-800 border-red-200';
                  default: return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };

              const getRecordIcon = (type: string) => {
                switch(type) {
                  case 'consultation': return '👨‍⚕️';
                  case 'test_result': return '🔬';
                  case 'prescription': return '💊';
                  case 'diagnosis': return '🩺';
                  default: return '📄';
                }
              };

              return (
                <Link
                  key={record.id}
                  to={`/records/${record.id}`}
                  className="block p-5 border-2 border-gray-100 rounded-xl hover:border-primary-300 hover:shadow-md transition-all duration-300 group bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-3xl">{getRecordIcon(record.recordType)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                            {record.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRecordTypeColor(record.recordType)}`}>
                            {getRecordIcon(record.recordType)} {record.recordType.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                          <span className="flex items-center space-x-1">
                            <Building2 size={14} />
                            <span>{record.facilityName}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>
                              {record.date 
                                ? format(new Date(record.date), 'MMM dd, yyyy')
                                : record.createdAt
                                ? format(new Date(record.createdAt), 'MMM dd, yyyy')
                                : 'N/A'
                              }
                            </span>
                          </span>
                        </div>
                        {record.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {record.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all mt-2" size={20} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

