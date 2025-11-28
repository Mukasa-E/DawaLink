import React, { useState, useEffect } from 'react';
import { prescriptionsAPI, patientsAPI, facilitiesAPI, facilityMedicinesAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { User, Facility, FacilityMedicine } from '../types';

const PrescriptionCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [availableMedicines, setAvailableMedicines] = useState<FacilityMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [facilityId, setFacilityId] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<Array<{ 
    medicineId?: string;
    name: string; 
    dosage: string; 
    frequency: string; 
    duration: string;
    stock?: number;
  }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  // Fetch facilities on mount and set user's facility if they have one
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const data = await facilitiesAPI.getAll();
        setFacilities(data);
        
        // Auto-select user's facility if they have one
        if (user?.facilityId) {
          const userFacility = data.find(f => f.id === user.facilityId);
          if (userFacility) {
            setFacilityId(user.facilityId);
            setSelectedFacility(userFacility);
          }
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      }
    };
    fetchFacilities();
  }, [user]);

  // Fetch medicines when facility is selected
  useEffect(() => {
    const fetchFacilityMedicines = async () => {
      if (!selectedFacility) {
        setAvailableMedicines([]);
        return;
      }

      setLoadingMedicines(true);
      try {
        const medicines = await facilityMedicinesAPI.getFacilityMedicines(selectedFacility.name);
        // Only show medicines that are in stock
        setAvailableMedicines(medicines.filter(m => m.stock > 0));
      } catch (err) {
        console.error('Error fetching facility medicines:', err);
        setError('Failed to load facility medicines');
        setAvailableMedicines([]);
      } finally {
        setLoadingMedicines(false);
      }
    };

    fetchFacilityMedicines();
  }, [selectedFacility]);

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length >= 2) {
        try {
          const results = await patientsAPI.search(searchQuery);
          setPatients(results);
        } catch (error) {
          console.error('Error searching patients:', error);
        }
      } else {
        setPatients([]);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = [...medicines];
    
    // If selecting a medicine from the dropdown
    if (field === 'medicineId') {
      const selectedMed = availableMedicines.find(m => m.id === value);
      if (selectedMed) {
        updated[index] = {
          ...updated[index],
          medicineId: value,
          name: selectedMed.name,
          dosage: selectedMed.strength || '',
          stock: selectedMed.stock,
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setMedicines(updated);
  };

  const handleFacilityChange = (selectedFacilityId: string) => {
    setFacilityId(selectedFacilityId);
    const facility = facilities.find(f => f.id === selectedFacilityId);
    setSelectedFacility(facility || null);
    // Clear selected medicines when facility changes
    setMedicines([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (!facilityId) {
      setError('Please select a facility');
      return;
    }
    
    setError(null);
    try {
      setSubmitting(true);
      await prescriptionsAPI.create({ 
        patientId: selectedPatient.id, 
        facilityId, 
        diagnosis: diagnosis || undefined, 
        notes: notes || undefined, 
        medicines 
      });
      navigate('/prescriptions');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/prescriptions"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Prescription</h1>
          <p className="text-gray-600 mt-2">Create a new prescription for a patient</p>
        </div>
      </div>

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Search */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patient *
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for patient..."
            className="input-field"
          />
          {selectedPatient && (
            <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="font-medium text-primary-900">{selectedPatient.name}</p>
              <p className="text-sm text-primary-700">{selectedPatient.email}</p>
            </div>
          )}
          {patients.length > 0 && !selectedPatient && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setSearchQuery(patient.name);
                    setPatients([]);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Facility */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facility *
          </label>
          <select
            value={facilityId}
            onChange={(e) => handleFacilityChange(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select facility...</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name} - {facility.city}
              </option>
            ))}
          </select>
          {selectedFacility && (
            <p className="mt-2 text-sm text-gray-600">
              {loadingMedicines 
                ? 'Loading available medicines...' 
                : `${availableMedicines.length} medicines available in stock`
              }
            </p>
          )}
        </div>

        {/* Diagnosis */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="input-field"
            placeholder="Enter diagnosis (optional)"
          />
        </div>

        {/* Medicines */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Medicines
            </label>
            <button
              type="button"
              onClick={addMedicine}
              disabled={!selectedFacility || availableMedicines.length === 0}
              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!selectedFacility ? 'Please select a facility first' : availableMedicines.length === 0 ? 'No medicines available in stock' : 'Add medicine'}
            >
              <Plus size={16} />
              <span>Add Medicine</span>
            </button>
          </div>
          
          {medicines.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              {!selectedFacility 
                ? 'Please select a facility first to see available medicines.'
                : availableMedicines.length === 0
                ? 'No medicines available in stock at this facility.'
                : 'No medicines added yet. Click "Add Medicine" to add medications.'
              }
            </p>
          )}

          <div className="space-y-4">
            {medicines.map((med, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg relative">
                <button
                  type="button"
                  onClick={() => removeMedicine(index)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                >
                  <X size={18} />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Select Medicine from Facility Stock *
                    </label>
                    <select
                      value={med.medicineId || ''}
                      onChange={(e) => updateMedicine(index, 'medicineId', e.target.value)}
                      className="input-field text-sm"
                      required
                    >
                      <option value="">Choose a medicine...</option>
                      {availableMedicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} - {medicine.strength} (Stock: {medicine.stock})
                        </option>
                      ))}
                    </select>
                    {med.stock !== undefined && med.stock < 10 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Low stock: Only {med.stock} units available
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g., 500mg"
                      readOnly={!!med.medicineId}
                      title={med.medicineId ? 'Auto-filled from medicine' : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g., 3 times daily"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="input-field text-sm"
                      placeholder="e.g., 7 days"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field"
            rows={3}
            placeholder="Any additional instructions or notes (optional)"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center space-x-2 px-6 py-3"
          >
            <Save size={20} />
            <span>{submitting ? 'Creating...' : 'Create Prescription'}</span>
          </button>
          <Link to="/prescriptions" className="btn-secondary px-6 py-3">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionCreate;
