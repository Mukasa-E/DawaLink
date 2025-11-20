import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { referralsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import type { Referral } from '../types';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'completed';

export const Referrals: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const data = await referralsAPI.getAll();
        setReferrals(data);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, []);

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.facilityName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || referral.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-600" size={16} />;
      case 'completed':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'accepted':
        return <CheckCircle className="text-blue-600" size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Digital Referrals
          </h1>
          <p className="text-gray-600 mt-2">Manage and track patient referrals</p>
        </div>
        {user?.role === 'healthcare_provider' && (
          <Link
            to="/referrals/create"
            className="btn-primary flex items-center space-x-2 px-6 py-3 self-start md:self-auto"
          >
            <Plus size={20} />
            <span>New Referral</span>
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
              placeholder="Search by patient, reason, or facility..."
              className="input-field pl-10 py-3"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="input-field py-3 md:w-40"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Referrals List */}
      {loading ? (
        <div className="card text-center py-12 border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading referrals...</p>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="card text-center py-16 border border-gray-200">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">
            {searchQuery || filterStatus !== 'all'
              ? 'No referrals match your search'
              : 'No referrals yet'}
          </p>
          {user?.role === 'healthcare_provider' && !searchQuery && filterStatus === 'all' && (
            <Link
              to="/referrals/create"
              className="text-primary-600 hover:text-primary-700 font-medium mt-4 inline-block"
            >
              Create your first referral →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReferrals.map((referral) => (
            <Link
              key={referral.id}
              to={`/referrals/${referral.id}`}
              className="card border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {referral.patientName}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(referral.status)}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          referral.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : referral.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : referral.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3 truncate-2">{referral.reason}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">From</p>
                      <p className="text-gray-900 mt-0.5">{referral.referringFacility}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">To</p>
                      <p className="text-gray-900 mt-0.5">{referral.referredToFacility}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Date</p>
                      <p className="text-gray-900 mt-0.5">
                        {format(new Date(referral.createdAt), 'MMM dd, yyyy')}
                      </p>
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
      {!loading && referrals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{referrals.length}</p>
          </div>
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-yellow-600 uppercase tracking-wide font-semibold">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {referrals.filter((r) => r.status === 'pending').length}
            </p>
          </div>
          <div className="card border border-gray-200 text-center">
            <p className="text-sm text-green-600 uppercase tracking-wide font-semibold">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {referrals.filter((r) => r.status === 'completed').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

