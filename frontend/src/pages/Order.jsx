import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Loader2, MapPin } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { formatPrice } from '../utils/pricing';
import { OrderShimmer } from '../components/Shimmer';

const Order = () => {
  const navigate = useNavigate();
  const { user, selectedCountry, isGuestMode } = useSelector((state) => state.auth); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showContent, setShowContent] = useState(false);

  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isGuestMode) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get('/order/myorders');
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data || 'Failed to fetch orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isGuestMode, navigate]);

  useEffect(() => {
    if (loading) {
      setShowContent(false);
      const timer = setTimeout(() => setShowContent(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowContent(true);
    }
  }, [loading]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'shipped': return <Package className="w-5 h-5 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayAddress = (orderAddress) => {
    if (orderAddress && (orderAddress.street || orderAddress.city)) {
      return orderAddress;
    }
    
    if (user && user.address && (user.address.street || user.address.city)) {
      return user.address;
    }

    return {
      street: 'Default Street',
      city: 'Default City',
      state: 'Default State',
      zipCode: '000000',
      country: 'INDIA'
    };
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <OrderShimmer key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        {isGuestMode && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm flex items-center gap-2">
            <span className="font-medium">Guest Mode:</span> Demo preview — no real orders shown.
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start shopping to place your first order</p>
            <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Filter Buttons */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const addressToShow = getDisplayAddress(order.shippingAddress);
                return (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm p-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">Order #{order._id.slice(-8)}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          {order.totalSavings > 0 && (
                            <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(order.totalAmount + order.totalSavings, selectedCountry)}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                    Saved {formatPrice(order.totalSavings, selectedCountry)}
                                  </span>
                            </div>
                          )}
                          <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount, selectedCountry)}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-gray-100 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
                      <div className="space-y-3">
                        {order.products.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.productId?.images?.[0] ? (
                                <img src={item.productId.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full"><Package className="w-6 h-6 text-gray-300" /></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{item.name || item.productId?.name}</h5>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                {item.discountApplied > 0 && (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                                    {item.discountApplied}% OFF
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {item.originalPrice && item.originalPrice !== item.price && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(item.originalPrice, selectedCountry)} each
                                  </span>
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {formatPrice(item.price, selectedCountry)} each
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              {item.originalPrice && item.originalPrice !== item.price && (
                                <div className="flex flex-col items-end">
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(item.originalPrice * item.quantity, selectedCountry)}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {formatPrice(item.price * item.quantity, selectedCountry)}
                                  </span>
                                  <span className="text-xs text-green-600 font-medium">
                                    Saved {formatPrice((item.originalPrice - item.price) * item.quantity, selectedCountry)}
                                  </span>
                                </div>
                              )}
                              {(!item.originalPrice || item.originalPrice === item.price) && (
                                <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity, selectedCountry)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h4 className="font-semibold text-gray-900">Shipping Address</h4>
                      </div>
                      
                      {addressToShow ? (
                        <div className="text-sm text-gray-600 pl-6">
                          <p>{addressToShow.street || ''}</p>
                          <p>
                            {[
                                addressToShow.city, 
                                addressToShow.state, 
                                addressToShow.zipCode
                            ].filter(Boolean).join(', ')}
                          </p>
                          <p className="font-medium text-gray-700">{addressToShow.country || 'INDIA'}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500 pl-6">Address information missing.</p>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Order;