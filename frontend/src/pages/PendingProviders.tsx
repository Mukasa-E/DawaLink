import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { facilitiesAPI } from '../services/api';
import { User } from '../types';
import { UserCheck, UserX, Clock, Mail, Phone, Briefcase, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const PendingProviders: React.FC = () => {
  const { user } = useAuth();
  const [pendingProviders, setPendingProviders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      setLoading(true);
      const providers = await facilitiesAPI.getPendingProviders(user?.facilityId);
      setPendingProviders(providers);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch pending providers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (providerId: string) => {
    try {
      setProcessingId(providerId);
      setError(null);
      setSuccess(null);
      
      const result = await facilitiesAPI.approveProvider(providerId);
      setSuccess(result.message || 'Provider approved successfully');
      
      // Remove from pending list
      setPendingProviders(prev => prev.filter(p => p.id !== providerId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve provider');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (providerId: string) => {
    try {
      setProcessingId(providerId);
      setError(null);
      setSuccess(null);
      
      const result = await facilitiesAPI.rejectProvider(providerId, rejectionReason);
      setSuccess(result.message || 'Provider request rejected');
      
      // Remove from pending list
      setPendingProviders(prev => prev.filter(p => p.id !== providerId));
      setShowRejectModal(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject provider');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Provider Registrations</h1>
        <p className="text-gray-600">Review and approve healthcare providers requesting to join your facility</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {pendingProviders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <UserCheck className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Requests</h3>
          <p className="text-gray-500">There are no healthcare providers waiting for approval at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingProviders.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Requested: {formatDate(provider.createdAt)}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Pending
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-gray-700">
                  <Mail size={18} className="text-gray-400" />
                  <span className="text-sm">{provider.email}</span>
                </div>
                
                {provider.phone && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone size={18} className="text-gray-400" />
                    <span className="text-sm">{provider.phone}</span>
                  </div>
                )}
                
                {provider.specialization && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Briefcase size={18} className="text-gray-400" />
                    <span className="text-sm">Specialization: {provider.specialization}</span>
                  </div>
                )}
                
                {provider.licenseNumber && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <FileText size={18} className="text-gray-400" />
                    <span className="text-sm">License: {provider.licenseNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleApprove(provider.id)}
                  disabled={processingId === provider.id}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <UserCheck size={18} />
                  <span>{processingId === provider.id ? 'Approving...' : 'Approve'}</span>
                </button>
                
                <button
                  onClick={() => setShowRejectModal(provider.id)}
                  disabled={processingId === provider.id}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <UserX size={18} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Provider Request</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection (optional):</p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="e.g., Invalid credentials, incomplete information..."
            />
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={processingId === showRejectModal}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processingId === showRejectModal}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === showRejectModal ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
