import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, AlertCircle, CheckCircle, Package, Clock } from 'lucide-react';
import { deliveryAPI } from '../services/api';
import type { DeliveryAssignment, DeliveryStatus } from '../types';

export default function DeliveryAssignments() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<DeliveryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | ''>('');
  const [updatingDelivery, setUpdatingDelivery] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    filterDeliveries();
  }, [deliveries, statusFilter]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await deliveryAPI.getMyDeliveries();
      setDeliveries(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const filterDeliveries = () => {
    let filtered = [...deliveries];
    
    if (statusFilter) {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    
    setFilteredDeliveries(filtered);
  };

  const handleUpdateStatus = async (id: string, newStatus: DeliveryStatus, notes?: string) => {
    try {
      setUpdatingDelivery(id);
      
      // Get current location if browser supports it
      if (navigator.geolocation && (newStatus === 'picked_up' || newStatus === 'in_transit' || newStatus === 'delivered')) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await deliveryAPI.updateStatus(id, {
              status: newStatus,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              notes,
            });
            await loadDeliveries();
          },
          async () => {
            // If geolocation fails, update without coordinates
            await deliveryAPI.updateStatus(id, { status: newStatus, notes });
            await loadDeliveries();
          }
        );
      } else {
        await deliveryAPI.updateStatus(id, { status: newStatus, notes });
        await loadDeliveries();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update delivery status');
    } finally {
      setUpdatingDelivery(null);
    }
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

  const getNextStatus = (currentStatus: DeliveryStatus): DeliveryStatus | null => {
    switch (currentStatus) {
      case 'assigned': return 'picked_up';
      case 'picked_up': return 'in_transit';
      case 'in_transit': return 'delivered';
      default: return null;
    }
  };

  const getActionLabel = (status: DeliveryStatus): string => {
    switch (status) {
      case 'assigned': return 'Mark as Picked Up';
      case 'picked_up': return 'Start Delivery';
      case 'in_transit': return 'Mark as Delivered';
      default: return 'Update Status';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-sm text-gray-500">Manage your delivery assignments</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Deliveries: <span className="font-semibold text-gray-900">{deliveries.length}</span>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | '')}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="assigned">Assigned</option>
          <option value="picked_up">Picked Up</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white shadow rounded-lg text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {deliveries.length === 0 
                ? "Accept delivery assignments from the dashboard." 
                : "Try adjusting your status filter."}
            </p>
          </div>
        ) : (
          filteredDeliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{delivery.order?.orderNumber || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Assigned: {new Date(delivery.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {/* Pickup Location */}
                <div className="mb-4">
                  <div className="flex items-start">
                    <Package className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Pickup from:</p>
                      <p className="text-sm text-gray-900">{delivery.order?.pharmacy?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">
                        {delivery.order?.pharmacy?.address}, {delivery.order?.pharmacy?.city}
                      </p>
                      <p className="text-sm text-gray-500">
                        Phone: {delivery.order?.pharmacy?.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="mb-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Deliver to:</p>
                      <p className="text-sm text-gray-900">{delivery.order?.deliveryAddress || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-4 pl-7 border-l-2 border-gray-200 space-y-2">
                  {delivery.pickupTime && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-500">
                        Picked up: {new Date(delivery.pickupTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {delivery.deliveryTime && (
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-gray-500">
                        Delivered: {new Date(delivery.deliveryTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* GPS Coordinates */}
                {(delivery.currentLatitude || delivery.currentLongitude) && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">Last Known Location:</p>
                    <p className="text-sm text-gray-500">
                      Lat: {delivery.currentLatitude}, Long: {delivery.currentLongitude}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/orders/${delivery.order?.id}`)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Order Details
                  </button>
                  
                  {delivery.status !== 'delivered' && delivery.status !== 'failed' && (
                    <div className="flex space-x-2">
                      {getNextStatus(delivery.status) && (
                        <button
                          onClick={() => handleUpdateStatus(delivery.id, getNextStatus(delivery.status)!)}
                          disabled={updatingDelivery === delivery.id}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                          {updatingDelivery === delivery.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              {delivery.status === 'assigned' && <Package className="h-4 w-4 mr-2" />}
                              {delivery.status === 'picked_up' && <Truck className="h-4 w-4 mr-2" />}
                              {delivery.status === 'in_transit' && <CheckCircle className="h-4 w-4 mr-2" />}
                              {getActionLabel(delivery.status)}
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const reason = prompt('Enter reason for failure:');
                          if (reason) handleUpdateStatus(delivery.id, 'failed', reason);
                        }}
                        disabled={updatingDelivery === delivery.id}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Mark as Failed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
