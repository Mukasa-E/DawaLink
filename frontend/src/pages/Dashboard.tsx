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

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
  }, [user]);

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
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
          {t('dashboard.welcome')}, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-2">{t('dashboard.overview')}</p>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
        {user?.role === 'patient' && user?.preferredFacility && (
          <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Building2 className="text-blue-600" size={20} />
            <span className="text-sm text-gray-700">
              Your Trusted Facility: <span className="font-semibold text-blue-900">{user.preferredFacility}</span>
            </span>
          </div>
        )}
      </div>

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

      {/* Stats Grid */}
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

      {/* Recent Referrals */}
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

      {/* Recent Records */}
      <div className="card border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboard.recentRecords')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Latest medical records</p>
          </div>
          <Link
            to="/records"
            className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm font-medium hover:underline"
          >
            <span>{t('common.viewAll') || 'View All'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600">{t('records.noRecords') || 'No records found'}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentRecords.map((record) => (
              <Link
                key={record.id}
                to={`/records/${record.id}`}
                className="p-4 border border-gray-100 rounded-lg hover:bg-green-50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-700">
                        {record.title}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.recordType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{record.facilityName}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

