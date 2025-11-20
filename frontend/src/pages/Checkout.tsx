import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Smartphone, Banknote, Upload, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { ordersAPI, paymentsAPI } from '../services/api';
import type { Medicine, CartItem, PaymentMethod } from '../types';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      })).filter(item => item.medicine);

      setCartItems(items);

      if (items.length === 0) {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      navigate('/cart');
    }
  };

  const getTotalAmount = () => {
    return cartItems.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
  };

  const requiresPrescription = () => {
    return cartItems.some(item => item.medicine.requiresPrescription);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address');
      return;
    }

    if (requiresPrescription() && !prescriptionFile) {
      setError('Please upload a prescription for prescription-required medicines');
      return;
    }

    if (paymentMethod === 'mobile_money' && !phoneNumber.trim()) {
      setError('Please enter your mobile money phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get pharmacy ID from first item (all items should be from same pharmacy)
      const pharmacyId = cartItems[0].medicine.pharmacyId;

      // Prepare order items
      const items = cartItems.map(item => ({
        medicineId: item.medicine.id,
        quantity: item.quantity,
      }));

      // Create order
      const order = await ordersAPI.create({
        pharmacyId,
        deliveryAddress,
        items,
      });

      // Process payment
      await paymentsAPI.process({
        orderId: order.id,
        amount: getTotalAmount(),
        method: paymentMethod,
        phoneNumber: paymentMethod === 'mobile_money' ? phoneNumber : undefined,
      });

      // Clear cart
      localStorage.removeItem('cart');
      localStorage.removeItem('cartItems');

      setSuccess(true);
      
      // Redirect to order tracking after 2 seconds
      setTimeout(() => {
        navigate(`/orders/${order.id}`);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed. Redirecting to order details...
          </p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/cart')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-1">Complete your order</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your full delivery address..."
              rows={3}
              className="input"
              required
            />
          </div>

          {/* Prescription Upload */}
          {requiresPrescription() && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prescription</h3>
              <p className="text-sm text-gray-600 mb-4">
                Some items in your cart require a prescription. Please upload your prescription.
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="btn-primary inline-block">
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {prescriptionFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {prescriptionFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
            
            <div className="space-y-3">
              {/* Mobile Money */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'mobile_money' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mobile_money"
                  checked={paymentMethod === 'mobile_money'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-primary focus:ring-primary"
                />
                <Smartphone className="w-6 h-6 ml-3 text-primary" />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Mobile Money</p>
                  <p className="text-sm text-gray-600">M-Pesa, Airtel Money, Tigo Pesa</p>
                </div>
              </label>

              {paymentMethod === 'mobile_money' && (
                <div className="ml-12 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+255712345678"
                    className="input"
                    required
                  />
                </div>
              )}

              {/* Card Payment */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-primary focus:ring-primary"
                />
                <CreditCard className="w-6 h-6 ml-3 text-primary" />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Credit/Debit Card</p>
                  <p className="text-sm text-gray-600">Visa, Mastercard</p>
                </div>
              </label>

              {/* Cash on Delivery */}
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-primary focus:ring-primary"
                />
                <Banknote className="w-6 h-6 ml-3 text-primary" />
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Cash on Delivery</p>
                  <p className="text-sm text-gray-600">Pay when you receive</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                {cartItems.map(item => (
                  <div key={item.medicine.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.medicine.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      TSh {(item.medicine.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                
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
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
