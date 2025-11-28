import React, { useEffect, useState } from 'react';
import { prescriptionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Prescription {
  id: string;
  prescriptionNumber: string;
  status: string;
  facilityName: string;
  createdAt: string;
}

const PrescriptionsList: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const items = await prescriptionsAPI.list();
        setData(items);
      } catch (e: any) {
        setError(e.message || 'Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading prescriptions...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Prescriptions</h1>
        {user?.role !== 'patient' && (
          <a href="/prescriptions/create" className="px-3 py-2 rounded bg-primary-600 text-white text-sm">Create</a>
        )}
      </div>
      <table className="w-full text-sm bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-2">Number</th>
            <th className="text-left p-2">Facility</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {data.map(p => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.prescriptionNumber}</td>
              <td className="p-2">{p.facilityName}</td>
              <td className="p-2">{p.status}</td>
              <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={4} className="p-4 text-center text-gray-500">No prescriptions yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PrescriptionsList;
