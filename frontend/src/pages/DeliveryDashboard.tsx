import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { deliveryAPI } from '../services/api';
import type { DeliveryAssignment } from '../types';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([]);
  const [availableDeliveries, setAvailableDeliveries] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [myDeliveries, available] = await Promise.all([
        deliveryAPI.getMyDeliveries(),
        deliveryAPI.getAvailable(),
      ]);
      
      setDeliveries(myDeliveries);
      setAvailableDeliveries(available);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const activeDeliveries = deliveries.filter(
      d => d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit'
    ).length;
    const completedToday = deliveries.filter(
      d => d.status === 'delivered' && 
      new Date(d.deliveredAt || '').toDateString() === new Date().toDateString()
    ).length;
    const totalCompleted = deliveries.filter(d => d.status === 'delivered').length;
    
    return { activeDeliveries, completedToday, totalCompleted };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAcceptDelivery = async (id: string) => {
    try {
      await deliveryAPI.accept(id);
      await loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept delivery');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
          <p className="text-sm text-gray-500">Manage your delivery assignments</p>
        </div>
        <button
          onClick={() => navigate('/delivery/assignments')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Truck className="h-4 w-4 mr-2" />
          View All Deliveries
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Deliveries</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.activeDeliveries}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.completedToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Completed</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalCompleted}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available Jobs</dt>
                  <dd className="text-lg font-semibold text-gray-900">{availableDeliveries.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Deliveries */}
      {availableDeliveries.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Available Deliveries</h2>
            <p className="text-sm text-gray-500">Accept new delivery assignments</p>
          </div>
          <div className="divide-y divide-gray-200">
            {availableDeliveries.slice(0, 3).map((delivery) => (
              <div key={delivery.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Order #{delivery.order?.orderNumber || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Pickup: {delivery.order?.pharmacy?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Deliver to: {delivery.order?.deliveryAddress || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptDelivery(delivery.id)}
                    className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Deliveries */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">My Active Deliveries</h2>
            <button
              onClick={() => navigate('/delivery/assignments')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          {stats.activeDeliveries === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active deliveries</h3>
              <p className="mt-1 text-sm text-gray-500">
                {availableDeliveries.length > 0 
                  ? "Accept a delivery from the available jobs above." 
                  : "Check back later for new delivery assignments."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deliveries
                .filter(d => d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit')
                .slice(0, 5)
                .map((delivery) => (
                  <div key={delivery.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            Order #{delivery.order?.orderNumber || 'N/A'}
                          </p>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                            {delivery.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Pickup: {delivery.order?.pharmacy?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Deliver to: {delivery.order?.deliveryAddress || 'N/A'}
                        </p>
                        {delivery.pickupTime && (
                          <p className="text-xs text-gray-400 mt-1">
                            Picked up: {new Date(delivery.pickupTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/delivery/assignments/${delivery.id}`)}
                        className="ml-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
