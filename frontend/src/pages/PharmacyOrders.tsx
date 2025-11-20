import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Package, Truck, CheckCircle } from 'lucide-react';
import { ordersAPI, pharmacyAPI } from '../services/api';
import type { Order, Pharmacy, OrderStatus } from '../types';

export default function PharmacyOrders() {
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const pharmacyData = await pharmacyAPI.getMyPharmacy();
      setPharmacy(pharmacyData);
      
      const ordersData = await ordersAPI.getPharmacyOrders(pharmacyData.id);
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrder(orderId);
      await ordersAPI.updateStatus(orderId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'ready';
      case 'ready': return 'out_for_delivery';
      case 'out_for_delivery': return 'delivered';
      default: return null;
    }
  };

  const getActionLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'Confirm Order';
      case 'confirmed': return 'Mark as Ready';
      case 'ready': return 'Out for Delivery';
      case 'out_for_delivery': return 'Mark as Delivered';
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage incoming customer orders</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Orders: <span className="font-semibold text-gray-900">{orders.length}</span>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white shadow rounded-lg text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {orders.length === 0 
                ? "Orders will appear here once customers place them." 
                : "Try adjusting your status filter."}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      TSh {order.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Payment: <span className={order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
                        {order.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                {/* Delivery Address */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Delivery Address:</p>
                  <p className="text-sm text-gray-900">{order.deliveryAddress}</p>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">{item.medicine?.name || 'Medicine'}</span>
                          <span className="text-gray-500 ml-2">x {item.quantity}</span>
                        </div>
                        <span className="font-medium">TSh {item.subtotal.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Full Details
                  </button>
                  
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="flex space-x-2">
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, getNextStatus(order.status)!)}
                          disabled={updatingOrder === order.id}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                        >
                          {updatingOrder === order.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              {order.status === 'pending' && <CheckCircle className="h-4 w-4 mr-2" />}
                              {order.status === 'confirmed' && <Package className="h-4 w-4 mr-2" />}
                              {order.status === 'ready' && <Truck className="h-4 w-4 mr-2" />}
                              {order.status === 'out_for_delivery' && <CheckCircle className="h-4 w-4 mr-2" />}
                              {getActionLabel(order.status)}
                            </>
                          )}
                        </button>
                      )}
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
