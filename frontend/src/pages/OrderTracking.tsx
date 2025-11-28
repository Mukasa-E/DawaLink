import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Phone, MapPin } from 'lucide-react';
import { ordersAPI } from '../services/api';
import type { Order, OrderStatus } from '../types';

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ordersAPI.getById(id!);
      setOrder(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (): Array<{
    status: OrderStatus;
    label: string;
    icon: any;
  }> => {
    return [
      { status: 'pending', label: 'Order Placed', icon: Package },
      { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { status: 'ready', label: 'Ready', icon: Package },
      { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
      { status: 'delivered', label: 'Delivered', icon: CheckCircle },
    ];
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ready: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isStatusCompleted = (checkStatus: OrderStatus, currentStatus: OrderStatus) => {
    const steps = getStatusSteps();
    const checkIndex = steps.findIndex(s => s.status === checkStatus);
    const currentIndex = steps.findIndex(s => s.status === currentStatus);
    return checkIndex <= currentIndex;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="card p-12 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
        <p className="text-gray-600 mb-6">{error || 'Unable to find this order'}</p>
        <button onClick={() => navigate('/medicines')} className="btn-primary">
          Browse Medicines
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/medicines')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
        </div>
        <div className="ml-auto">
          <span className={`badge ${getStatusColor(order.status)}`}>
            {order.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Order Status Timeline */}
      {order.status !== 'cancelled' && (
        <div className="card p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Status Steps */}
            <div className="space-y-8">
              {getStatusSteps().map((step, index) => {
                const StatusIcon = step.icon;
                const completed = isStatusCompleted(step.status, order.status);
                
                return (
                  <div key={step.status} className="relative flex items-center">
                    {/* Icon */}
                    <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                      completed 
                        ? 'bg-primary border-primary text-white' 
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}>
                      <StatusIcon className="w-6 h-6" />
                    </div>

                    {/* Label */}
                    <div className="ml-6">
                      <p className={`font-medium ${completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {completed && step.status === order.status && (
                        <p className="text-sm text-gray-600 mt-1">
                          Current status
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled Status */}
      {order.status === 'cancelled' && (
        <div className="card p-8 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-4">
            <XCircle className="w-12 h-12 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Order Cancelled</h3>
              <p className="text-red-700">This order has been cancelled.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Order Number</dt>
              <dd className="font-medium text-gray-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Order Date</dt>
              <dd className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Total Amount</dt>
              <dd className="text-xl font-bold text-primary">
                TSh {order.totalAmount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Payment Status</dt>
              <dd>
                <span className={`badge ${
                  (order.paymentStatus || 'pending') === 'paid' 
                    ? 'bg-green-100 text-green-800'
                    : (order.paymentStatus || 'pending') === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(order.paymentStatus || 'pending').toUpperCase()}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Delivery Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Delivery Address</p>
                <p className="font-medium text-gray-900">{order.deliveryAddress}</p>
              </div>
            </div>

            {order.pharmacy && (
              <div className="flex items-start space-x-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Pharmacy</p>
                  <p className="font-medium text-gray-900">{order.pharmacy.name}</p>
                  {order.pharmacy.phone && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {order.pharmacy.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {order.delivery?.deliveryAgent && (
              <div className="flex items-start space-x-3">
                <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Delivery Agent</p>
                  <p className="font-medium text-gray-900">{order.delivery.deliveryAgent.name}</p>
                  {order.delivery.deliveryAgent.phone && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {order.delivery.deliveryAgent.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.medicine?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      TSh {item.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      TSh {item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
