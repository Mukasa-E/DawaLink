import React, { useEffect, useState } from 'react';
import { ordersAPI } from '../services/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  facilityName?: string; // optional
  totalAmount: number;
  createdAt: string;
}

const FacilityOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
    const list = await ordersAPI.getFacility();
    setOrders(list as any);
      } catch (e: any) {
        setError(e.message || 'Failed to load facility orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading facility orders...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Facility Orders</h1>
      <table className="w-full text-sm bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Number</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Total</th>
            <th className="text-left p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-t">
              <td className="p-2"><a className="text-primary-600" href={`/orders/${o.id}`}>{o.orderNumber}</a></td>
              <td className="p-2">{o.status}</td>
              <td className="p-2">{o.totalAmount.toFixed(2)}</td>
              <td className="p-2">{new Date(o.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No facility orders yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default FacilityOrders;
