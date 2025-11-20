import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminAPI, referralsAPI, recordsAPI } from '../services/api';
import { Users, FileText, Activity, Building2, TrendingUp, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import type { Referral, MedicalRecord } from '../types';

interface AdminStats {
  totalUsers: number;
  totalReferrals: number;
  totalRecords: number;
  activeFacilities: number;
}

export const Admin: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReferrals: 0,
    totalRecords: 0,
    activeFacilities: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'records'>('overview');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsData, referralsData, recordsData] = await Promise.all([
          adminAPI.getStats(),
          referralsAPI.getAll(),
          recordsAPI.getAll(),
        ]);
        setStats(statsData);
        setReferrals(referralsData);
        setRecords(recordsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Calculate metrics
  const referralStats = {
    pending: referrals.filter((r) => r.status === 'pending').length,
    completed: referrals.filter((r) => r.status === 'completed').length,
    accepted: referrals.filter((r) => r.status === 'accepted').length,
  };

  const recordTypes = records.reduce((acc, record) => {
    acc[record.recordType] = (acc[record.recordType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      trend: '+12%',
    },
    {
      name: 'Total Referrals',
      value: stats.totalReferrals,
      icon: FileText,
      color: 'text-green-600 bg-green-50',
      trend: '+8%',
    },
    {
      name: 'Total Records',
      value: stats.totalRecords,
      icon: Activity,
      color: 'text-purple-600 bg-purple-50',
      trend: '+15%',
    },
    {
      name: 'Active Facilities',
      value: stats.activeFacilities,
      icon: Building2,
      color: 'text-orange-600 bg-orange-50',
      trend: '+5%',
    },
  ];

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
          {t('admin.title')}
        </h1>
        <p className="text-gray-600 mt-2">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="card border border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <span className="text-green-600 text-sm font-semibold">{stat.trend}</span>
              </div>
              <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                {stat.name}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 size={20} />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'referrals'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Referrals</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`py-4 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'records'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity size={20} />
              <span>Records</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Referral Status Chart */}
          <div className="card border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Status Distribution</h3>
            <div className="space-y-4">
              {[
                { label: 'Pending', value: referralStats.pending, color: 'bg-yellow-400' },
                { label: 'Accepted', value: referralStats.accepted, color: 'bg-blue-400' },
                { label: 'Completed', value: referralStats.completed, color: 'bg-green-400' },
              ].map((item) => {
                const total = Object.values(referralStats).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.value} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Record Types Chart */}
          <div className="card border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Types Distribution</h3>
            <div className="space-y-4">
              {Object.entries(recordTypes).map(([type, count]) => {
                const total = Object.values(recordTypes).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="card border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Facility</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 10).map((referral) => (
                  <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{referral.patientName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{referral.providerName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{referral.facilityName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          referral.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : referral.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(referral.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="card border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Facility</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Provider</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 10).map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{record.title}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.recordType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.facilityName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{record.providerName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

