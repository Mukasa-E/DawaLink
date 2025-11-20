import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Package } from 'lucide-react';
import type { Medicine, CartItem } from '../types';

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '{}');
      const medicines = JSON.parse(localStorage.getItem('cartItems') || '{}');
      
      const items: CartItem[] = Object.entries(cart).map(([id, quantity]) => ({
        medicine: medicines[id] as Medicine,
        quantity: quantity as number,
      })).filter(item => item.medicine); // Filter out any invalid items

      setCartItems(items);
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (medicineId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(medicineId);
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    cart[medicineId] = newQuantity;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  };

  const removeItem = (medicineId: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    const medicines = JSON.parse(localStorage.getItem('cartItems') || '{}');
    
    delete cart[medicineId];
    delete medicines[medicineId];
    
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartItems', JSON.stringify(medicines));
    loadCart();
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      localStorage.removeItem('cart');
      localStorage.removeItem('cartItems');
      loadCart();
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const groupByPharmacy = () => {
    const grouped: { [pharmacyId: string]: CartItem[] } = {};
    cartItems.forEach(item => {
      const pharmacyId = item.medicine.pharmacyId;
      if (!grouped[pharmacyId]) {
        grouped[pharmacyId] = [];
      }
      grouped[pharmacyId].push(item);
    });
    return grouped;
  };

  const proceedToCheckout = () => {
    const grouped = groupByPharmacy();
    const pharmacyCount = Object.keys(grouped).length;
    
    if (pharmacyCount > 1) {
      alert('Currently, you can only order from one pharmacy at a time. Please remove items from other pharmacies.');
      return;
    }
    
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 flex items-center space-x-2"
          >
            <Trash2 className="w-5 h-5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {/* Empty Cart */}
      {cartItems.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-6">Add some medicines to get started</p>
          <button
            onClick={() => navigate('/medicines')}
            className="btn-primary"
          >
            Browse Medicines
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(groupByPharmacy()).map(([pharmacyId, items]) => {
              const pharmacy = items[0]?.medicine.pharmacy;
              return (
                <div key={pharmacyId} className="card">
                  {/* Pharmacy Header */}
                  {pharmacy && (
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <h3 className="font-semibold text-gray-900">{pharmacy.name}</h3>
                      {pharmacy.city && (
                        <p className="text-sm text-gray-600">{pharmacy.city}</p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div className="divide-y">
                    {items.map((item) => (
                      <div key={item.medicine.id} className="p-6 flex gap-4">
                        {/* Medicine Image */}
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg w-24 h-24 flex-shrink-0 flex items-center justify-center">
                          <Package className="w-8 h-8 text-primary/50" />
                        </div>

                        {/* Medicine Info */}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {item.medicine.name}
                          </h4>
                          {item.medicine.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                              {item.medicine.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary text-xs">
                              {item.medicine.category}
                            </span>
                            {item.medicine.requiresPrescription && (
                              <span className="text-xs text-orange-600">
                                ⚕️ Prescription Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Stock: {item.medicine.stock} available
                          </p>
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex flex-col items-end justify-between">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Price</p>
                            <p className="text-lg font-bold text-primary">
                              TSh {item.medicine.price.toLocaleString()}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                              className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                              disabled={item.quantity >= item.medicine.stock}
                              className="p-1 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-600">Subtotal</p>
                            <p className="text-lg font-bold text-gray-900">
                              TSh {(item.medicine.price * item.quantity).toLocaleString()}
                            </p>
                          </div>

                          <button
                            onClick={() => removeItem(item.medicine.id)}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items ({getTotalItems()})</span>
                    <span className="font-medium">TSh {getTotalAmount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        TSh {getTotalAmount().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate('/medicines')}
                  className="btn-secondary w-full mt-3"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
