import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { facilityMedicinesAPI } from '../services/api';
import { Upload, Plus, Search, Download, AlertCircle, Package, TrendingDown, X, Save } from 'lucide-react';
import type { FacilityMedicine } from '../types';

export const FacilityMedicines: React.FC = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<FacilityMedicine[]>([]);
  const [facilityName, setFacilityName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  
  // Form state for adding medicine
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    dosageForm: '',
    strength: '',
    stock: 0,
    reorderLevel: 10,
    requiresPrescription: false,
    notes: '',
  });

  // Load facility name and medicines on mount
  useEffect(() => {
    const loadFacilityAndMedicines = async () => {
      // Allow both facility admins and healthcare providers
      if (user?.role !== 'facility_admin' && user?.role !== 'healthcare_provider') {
        setError('Only facility staff can view medicines');
        return;
      }

      if (!user?.facilityId) {
        setError('User is not associated with any facility');
        return;
      }

      try {
        setLoading(true);
        // Get facility details to get the name
        const { facilitiesAPI } = await import('../services/api');
        const facility = await facilitiesAPI.getById(user.facilityId);
        setFacilityName(facility.name);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load facility');
      } finally {
        setLoading(false);
      }
    };

    loadFacilityAndMedicines();
  }, [user]);

  // Load medicines when facility name is available
  useEffect(() => {
    if (facilityName) {
      loadMedicines();
    }
  }, [facilityName, lowStockOnly]);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (lowStockOnly) {
        data = await facilityMedicinesAPI.getLowStockMedicines(facilityName);
      } else {
        data = await facilityMedicinesAPI.getFacilityMedicines(facilityName, {
          search: searchQuery,
        });
      }
      
      setMedicines(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (facilityName) {
      loadMedicines();
    }
  };

  const handleCSVUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await facilityMedicinesAPI.uploadCSV(csvData);
      setSuccess(`Successfully uploaded ${result.count} medicines`);
      setShowUploadModal(false);
      setCsvData('');
      loadMedicines();
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    try {
      await facilityMedicinesAPI.updateStock(id, newStock);
      setSuccess('Stock updated successfully');
      loadMedicines();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    
    try {
      await facilityMedicinesAPI.deleteMedicine(id);
      setSuccess('Medicine deleted successfully');
      loadMedicines();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete medicine');
    }
  };

  const handleAddMedicine = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!newMedicine.name.trim()) {
        setError('Medicine name is required');
        return;
      }
      
      await facilityMedicinesAPI.addMedicine(newMedicine);
      
      setSuccess('Medicine added successfully');
      setShowAddModal(false);
      resetMedicineForm();
      loadMedicines();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  const resetMedicineForm = () => {
    setNewMedicine({
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      dosageForm: '',
      strength: '',
      stock: 0,
      reorderLevel: 10,
      requiresPrescription: false,
      notes: '',
    });
  };

  const downloadSampleCSV = () => {
    const sample = `name,Generic Name,Category,Manufacturer,Dosage Form,Strength,Stock,Reorder Level,Requires Prescription,Notes
Paracetamol,Acetaminophen,Analgesic,Generic Pharma,Tablet,500mg,100,20,false,Common pain reliever
Amoxicillin,Amoxicillin,Antibiotic,ABC Pharma,Capsule,250mg,50,10,true,Broad spectrum antibiotic
Ibuprofen,Ibuprofen,NSAID,XYZ Pharma,Tablet,400mg,75,15,false,Anti-inflammatory
Metformin,Metformin,Antidiabetic,MedCo,Tablet,500mg,120,25,true,Type 2 diabetes
Ciprofloxacin,Ciprofloxacin,Antibiotic,HealthPlus,Tablet,500mg,40,10,true,Fluoroquinolone antibiotic`;
    
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'facility-medicines-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Facility Medicines
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'facility_admin' 
              ? 'Manage medicines available at your healthcare facility'
              : 'View medicines available at your facility for prescribing'
            }
          </p>
        </div>
        {user?.role === 'facility_admin' && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={!facilityName}
              className="btn-primary flex items-center space-x-2 px-4 py-2"
            >
              <Upload size={18} />
              <span>Upload CSV</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!facilityName}
              className="btn-secondary flex items-center space-x-2 px-4 py-2"
            >
              <Plus size={18} />
              <span>Add Medicine</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Facility Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Facility
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900">{facilityName || 'Loading...'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.role === 'facility_admin' ? 'Facility Administrator' : 'Healthcare Provider'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Medicines
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or generic name..."
                className="input-field pr-10"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filters
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 flex items-center space-x-1">
                  <TrendingDown size={16} className="text-orange-600" />
                  <span>Low Stock Only</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {facilityName && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Medicines</p>
                <p className="text-2xl font-bold text-gray-900">{medicines.length}</p>
              </div>
            </div>
          </div>

          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingDown size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicines.filter(m => m.stock <= m.reorderLevel).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <AlertCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescription Required</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicines.filter(m => m.requiresPrescription).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medicines Table */}
      {facilityName && (
        <div className="card border border-gray-200">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredMedicines.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No medicines found</p>
                <p className="text-sm text-gray-500 mt-2">Upload a CSV file or add medicines manually</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicine Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Generic Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Form/Strength</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rx Required</th>
                    {user?.role === 'admin' && (
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMedicines.map((medicine) => {
                    const isLowStock = medicine.stock <= medicine.reorderLevel;
                    return (
                      <tr key={medicine.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{medicine.name}</p>
                            {medicine.manufacturer && (
                              <p className="text-xs text-gray-500">{medicine.manufacturer}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{medicine.genericName || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {medicine.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {medicine.dosageForm && medicine.strength
                            ? `${medicine.dosageForm} - ${medicine.strength}`
                            : medicine.dosageForm || medicine.strength || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={medicine.stock}
                              onChange={(e) => handleUpdateStock(medicine.id, parseInt(e.target.value))}
                              className={`w-20 px-2 py-1 border rounded text-sm ${
                                isLowStock
                                  ? 'border-orange-300 bg-orange-50 text-orange-900'
                                  : 'border-gray-300'
                              }`}
                              min="0"
                            />
                            {isLowStock && (
                              <span title="Low stock">
                                <AlertCircle size={16} className="text-orange-600" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Reorder at: {medicine.reorderLevel}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          {medicine.requiresPrescription ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </td>
                        {user?.role === 'admin' && (
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Upload CSV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Medicines CSV</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Your Facility: <span className="font-semibold text-gray-900">{facilityName}</span>
                  </p>
                </div>

                <div>
                  <button
                    onClick={downloadSampleCSV}
                    className="btn-secondary flex items-center space-x-2 px-4 py-2 w-full justify-center"
                  >
                    <Download size={18} />
                    <span>Download Sample CSV Template</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CSV Data *
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={12}
                    className="input-field font-mono text-sm"
                    placeholder="Paste your CSV data here...&#10;&#10;name,Generic Name,Category,Manufacturer,Dosage Form,Strength,Stock,Reorder Level,Requires Prescription,Notes&#10;Paracetamol,Acetaminophen,Analgesic,Generic Pharma,Tablet,500mg,100,20,false,Common pain reliever"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required columns: name. Optional: Generic Name, Category, Manufacturer, Dosage Form, Strength, Stock, Reorder Level, Requires Prescription, Notes
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={handleCSVUpload}
                    disabled={!csvData.trim() || loading}
                    className="btn-primary flex items-center space-x-2 px-6 py-3 flex-1"
                  >
                    <Upload size={18} />
                    <span>{loading ? 'Uploading...' : 'Upload Medicines'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setCsvData('');
                    }}
                    className="btn-secondary px-6 py-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add New Medicine</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetMedicineForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Facility: <span className="font-semibold text-gray-900">{facilityName}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Medicine Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={newMedicine.name}
                      onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Paracetamol"
                      required
                    />
                  </div>

                  {/* Generic Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      value={newMedicine.genericName}
                      onChange={(e) => setNewMedicine({ ...newMedicine, genericName: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Acetaminophen"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newMedicine.category}
                      onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select category...</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Antimalarial">Antimalarial</option>
                      <option value="Antidiabetic">Antidiabetic</option>
                      <option value="Antihypertensive">Antihypertensive</option>
                      <option value="Antiretroviral">Antiretroviral</option>
                      <option value="Antifungal">Antifungal</option>
                      <option value="Antihistamine">Antihistamine</option>
                      <option value="Anticonvulsant">Anticonvulsant</option>
                      <option value="Antipsychotic">Antipsychotic</option>
                      <option value="Antidepressant">Antidepressant</option>
                      <option value="NSAID">NSAID</option>
                      <option value="Corticosteroid">Corticosteroid</option>
                      <option value="Bronchodilator">Bronchodilator</option>
                      <option value="Diuretic">Diuretic</option>
                      <option value="Statin">Statin</option>
                      <option value="Vitamin">Vitamin</option>
                      <option value="Mineral">Mineral</option>
                      <option value="Contraceptive">Contraceptive</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={newMedicine.manufacturer}
                      onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Generic Pharma"
                    />
                  </div>

                  {/* Dosage Form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage Form
                    </label>
                    <select
                      value={newMedicine.dosageForm}
                      onChange={(e) => setNewMedicine({ ...newMedicine, dosageForm: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select form...</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Suspension">Suspension</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Sachet">Sachet</option>
                      <option value="Infusion">Infusion</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Strength */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strength
                    </label>
                    <input
                      type="text"
                      value={newMedicine.strength}
                      onChange={(e) => setNewMedicine({ ...newMedicine, strength: e.target.value })}
                      className="input-field"
                      placeholder="e.g., 500mg"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={newMedicine.stock}
                      onChange={(e) => setNewMedicine({ ...newMedicine, stock: parseInt(e.target.value) || 0 })}
                      className="input-field"
                      min="0"
                    />
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={newMedicine.reorderLevel}
                      onChange={(e) => setNewMedicine({ ...newMedicine, reorderLevel: parseInt(e.target.value) || 10 })}
                      className="input-field"
                      min="0"
                    />
                  </div>

                  {/* Requires Prescription */}
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMedicine.requiresPrescription}
                        onChange={(e) => setNewMedicine({ ...newMedicine, requiresPrescription: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Requires Prescription
                      </span>
                    </label>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={newMedicine.notes}
                      onChange={(e) => setNewMedicine({ ...newMedicine, notes: e.target.value })}
                      rows={3}
                      className="input-field"
                      placeholder="Additional information about the medicine..."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={handleAddMedicine}
                    disabled={!newMedicine.name.trim() || loading}
                    className="btn-primary flex items-center space-x-2 px-6 py-3 flex-1"
                  >
                    <Save size={18} />
                    <span>{loading ? 'Adding...' : 'Add Medicine'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetMedicineForm();
                    }}
                    className="btn-secondary px-6 py-3"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
