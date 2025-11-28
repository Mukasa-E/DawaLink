import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersAPI } from '../services/api';

type OrderItem = { facilityMedicineId: string; name: string; quantity: number; unitPrice: number; subtotal: number; };
type OrderLocal = { id: string; orderNumber: string; status: string; facilityName: string; totalAmount: number; createdAt: string; items: OrderItem[] };

const OrderDetails: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderLocal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
  const o = await ordersAPI.getById(id);
  setOrder(o as any);
      } catch (e: any) {
        setError(e.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div>Loading order...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Order {order.orderNumber}</h1>
      <div className="bg-white p-4 rounded shadow text-sm space-y-2">
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Facility:</strong> {order.facilityName}</p>
        <p><strong>Total:</strong> {order.totalAmount.toFixed(2)}</p>
        <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      </div>
      <h2 className="font-semibold">Items</h2>
      <table className="w-full text-sm bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Qty</th>
            <th className="text-left p-2">Unit Price</th>
            <th className="text-left p-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map(i => (
            <tr key={i.facilityMedicineId} className="border-t">
              <td className="p-2">{i.name}</td>
              <td className="p-2">{i.quantity}</td>
              <td className="p-2">{i.unitPrice.toFixed(2)}</td>
              <td className="p-2">{i.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderDetails;
