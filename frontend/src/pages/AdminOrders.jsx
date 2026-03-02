import React, { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';
import { formatPrice } from '../utils/pricing';
import { 
  Package, Clock, CheckCircle, XCircle, Loader2, 
  User, Save, Filter, Search, AlertCircle 
} from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const { user, selectedCountry, isGuestMode } = useSelector(state => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [userSelections, setUserSelections] = useState({});


  useEffect(() => {
    if (!user || !user.role || (user.role !== 'admin' && user.role !== 'superadmin')) {
      setError('Access denied: Admins only');
      setLoading(false);
      return;
    }

    if (isGuestMode) {
      setOrders([{
        _id: 'demo-order-1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        totalAmount: 0,
        products: [{ name: 'Demo Product', quantity: 0, price: 0, productId: null }],
        userId: { firstName: 'Demo', emailId: 'demo@example.com' }
      }]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/order/all');
        setOrders(res.data || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data || err.message || 'Failed to load orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isGuestMode]);


  // Update Single Order Status
  const updateStatus = async (orderId, status) => {
    if (isGuestMode) return;
    try {
      await axiosClient.put(`/order/updateOrderStatus/${orderId}`, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err) {
      alert('Update failed: ' + (err.response?.data || err.message));
    }
  };


  const updateUserOrders = async (userId, status) => {
    if (isGuestMode) return;
    if (!window.confirm(`Are you sure you want to set ALL orders for this user to ${status}?`)) return;
    
    try {
      await axiosClient.put(`/order/user/${userId}/status`, { status });
      setOrders(prev => prev.map(o => {
        const uid = o.userId && o.userId._id ? o.userId._id : o.userId;
        return uid === userId ? { ...o, status } : o;
      }));
      alert('All orders for the user updated');
    } catch (err) {
      alert('Bulk update failed: ' + (err.response?.data || err.message));
    }
  };

  const handleUserSelectionChange = (userId, value) => {
    setUserSelections(prev => ({ ...prev, [userId]: value }));
  };


  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'shipped': return <Package className="w-5 h-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'processing': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'shipped': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'delivered': return 'bg-green-50 border-green-200 text-green-800';
      case 'cancelled': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-500 mt-1">{isGuestMode ? 'Demo preview • No real data, modifications disabled' : 'Manage all user orders and status'}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Total Orders:</span>
            <span className="text-blue-600 font-bold">{orders.length}</span>
          </div>
        </div>

        {isGuestMode && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
            <span className="font-medium">Guest Mode:</span> Demo order preview — no real admin data shown.
          </div>
        )}
        {/* Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-2 items-center border border-gray-100">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                statusFilter === s
                  ? getStatusColor(s) + ' border-transparent shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found with status "{statusFilter}"</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
               const userId = order.userId?._id || order.userId;
               const userEmail = order.userId?.email || 'Unknown User';
               const userName = order.userId?.firstName ? `${order.userId.firstName} ${order.userId.lastName || ''}` : userEmail;
               const bulkStatus = userSelections[userId] ?? order.status;

               return (
                <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Order Header Bar */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-full shadow-sm border border-gray-100">
                        {getStatusIcon(order.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">#{order._id.slice(-8)}</h3>
                          <span className="text-xs text-gray-400 font-mono hidden sm:inline">{order._id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{userName}</span>
                          <span className="text-gray-400">•</span>
                          <span>{new Date(order.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>


                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 hidden sm:block">Status:</label>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">

                    <div className="space-y-4 mb-6">
                      {order.products.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between group">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              {item.productId?.images?.[0] ? (
                                <img
                                  src={item.productId.images[0]}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Package className="w-6 h-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.name || item.productId?.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatPrice(item.price, selectedCountry)}</p>
                            </div>
                          </div>
                        <p className="font-semibold text-gray-900">{formatPrice(item.quantity * item.price, selectedCountry)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 mb-4">
                      <div className="text-right">
                        <span className="text-sm text-gray-500">Order Total</span>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(order.totalAmount, selectedCountry)}</p>
                      </div>
                    </div>


                    {!isGuestMode && (
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800 font-medium">Bulk Action for {userName.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select 
                          value={bulkStatus}
                          onChange={(e) => handleUserSelectionChange(userId, e.target.value)}
                          className="flex-1 sm:flex-none text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1.5"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <button 
                          onClick={() => updateUserOrders(userId, bulkStatus)}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Save className="w-3 h-3" />
                          Apply All
                        </button>
                      </div>
                    </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;