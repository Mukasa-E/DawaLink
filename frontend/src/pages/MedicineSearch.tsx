import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Plus, Package, AlertCircle } from 'lucide-react';
import { medicinesAPI } from '../services/api';
import type { Medicine } from '../types';

export default function MedicineSearch() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const categories = [
    'Pain Relief',
    'Antibiotics',
    'Vitamins',
    'Cold & Flu',
    'Digestive Health',
    'Heart Health',
    'Diabetes Care',
    'Skin Care',
    'Other',
  ];

  useEffect(() => {
    loadMedicines();
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await medicinesAPI.search({
        q: searchQuery || undefined,
        category: category || undefined,
        inStock: inStockOnly,
        limit: 50,
      });
      setMedicines(response.medicines || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load medicines');
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedicines();
  };

  const addToCart = (medicine: Medicine) => {
    const newCart = { ...cart, [medicine.id]: (cart[medicine.id] || 0) + 1 };
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Also save medicine details
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '{}');
    cartItems[medicine.id] = medicine;
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Medicines</h1>
          <p className="text-gray-600 mt-1">Search and order medicines from verified pharmacies</p>
        </div>
        <button
          onClick={() => navigate('/cart')}
          className="relative btn-primary flex items-center space-x-2"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Cart</span>
          {getCartCount() > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {getCartCount()}
            </span>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Medicines
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="inStock"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
              Show only in-stock medicines
            </label>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Medicines Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading medicines...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {medicines.map((medicine) => (
            <div key={medicine.id} className="card hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Medicine Image Placeholder */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg h-48 flex items-center justify-center mb-4">
                  <Package className="w-16 h-16 text-primary/50" />
                </div>

                {/* Medicine Info */}
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                  {medicine.name}
                </h3>
                
                {medicine.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {medicine.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="badge badge-primary">{medicine.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className={medicine.stock > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {medicine.stock > 0 ? `${medicine.stock} available` : 'Out of stock'}
                    </span>
                  </div>

                  {medicine.requiresPrescription && (
                    <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      ⚕️ Requires Prescription
                    </div>
                  )}
                </div>

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-2xl font-bold text-primary">
                      TSh {medicine.price.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(medicine)}
                    disabled={medicine.stock === 0}
                    className={`btn-sm ${
                      medicine.stock === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'btn-primary'
                    } flex items-center space-x-1`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {cart[medicine.id] && (
                  <div className="mt-2 text-sm text-green-600 font-medium text-center">
                    {cart[medicine.id]} in cart
                  </div>
                )}
              </div>

              {/* Pharmacy Info */}
              {medicine.pharmacy && (
                <div className="px-6 pb-4 pt-2 border-t bg-gray-50">
                  <p className="text-xs text-gray-600">
                    Sold by: <span className="font-medium text-gray-900">{medicine.pharmacy.name}</span>
                  </p>
                  {medicine.pharmacy.city && (
                    <p className="text-xs text-gray-500">{medicine.pharmacy.city}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!loading && medicines.length > 0 && (
        <div className="text-center text-gray-600">
          Showing {medicines.length} medicine{medicines.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
