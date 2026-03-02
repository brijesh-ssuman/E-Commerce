import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Package, Plus, Edit, Trash2, Search, Loader2, Star, Eye, Zap, X } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { formatPrice, getPriceForCountry } from '../utils/pricing';

const AdminProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCountry, isGuestMode } = useSelector(state => state.auth);
  const redirectMessage = location.state?.message;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFreshModal, setShowFreshModal] = useState(false);
  const [selectedFreshProduct, setSelectedFreshProduct] = useState(null);
  const [freshConfig, setFreshConfig] = useState({
    endTime: '',
    discount: 20
  });
  const [currentFreshId, setCurrentFreshId] = useState(null);

  const categories = ['all', 'electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'automotive'];

  useEffect(() => {
    fetchProducts();
    fetchCurrentFreshSale();
  }, []);

  const fetchCurrentFreshSale = async () => {
    try {
      const response = await axiosClient.get('/freshsale/current');
      const data = response.data.freshSale;
      if (data) {
        setCurrentFreshId(data.productId);
      } else {
        setCurrentFreshId(null);
      }
    } catch (error) {
      console.error('Failed to fetch current fresh sale:', error);
      setCurrentFreshId(null);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/product/getAllProducts');
      setProducts(response.data);
    } catch (error) {
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (isGuestMode) return;
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axiosClient.delete(`/product/delete/${productId}`);
      setProducts(prev => prev.filter(product => product._id !== productId));
    } catch (error) {
      setError('Failed to delete product');
    }
  };

  const openFreshModal = (product) => {
    setSelectedFreshProduct(product);
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());

    setFreshConfig({
      endTime: tomorrow.toISOString().slice(0, 16),
      discount: 20
    });
    setShowFreshModal(true);
  };

  const saveFreshSale = async () => {
    if (!selectedFreshProduct || !freshConfig.endTime) return;
    try {
      const response = await axiosClient.post('/freshsale/create', {
        productId: selectedFreshProduct._id,
        endTime: freshConfig.endTime,
        discount: freshConfig.discount
      });

      setCurrentFreshId(selectedFreshProduct._id);
      setShowFreshModal(false);
      alert(`Sale started for ${selectedFreshProduct.name}!`);
    } catch (error) {
      // console.error('Failed to create fresh sale:', error);
      alert('Failed to start sale. Please try again.');
    }
  };

  const removeFreshSale = async () => {
    try {
      await axiosClient.put('/freshsale/stop');
      setCurrentFreshId(null);
      alert('Active sale stopped.');
    } catch (error) {
      // console.error('Failed to stop fresh sale:', error);
      alert('Failed to stop sale. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {redirectMessage && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm flex items-center justify-between">
            <span>{redirectMessage}</span>
            <button onClick={() => navigate(location.pathname, { replace: true, state: {} })} className="text-amber-600 hover:text-amber-800 font-medium">Dismiss</button>
          </div>
        )}
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-blue-600" /> Product Admin
            </h1>
            <p className="text-gray-500">{isGuestMode ? 'Demo preview • Read-only, no changes allowed' : 'Manage products and set Sales'}</p>
          </div>
          {!isGuestMode && (
            <div className="flex gap-3">
               {currentFreshId && (
                  <button onClick={removeFreshSale} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition-colors">
                      Stop Current Sale
                  </button>
               )}
               <button onClick={() => navigate('/admin/products/create')} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                 <Plus size={18} /> Add Product
               </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border outline-none"
          >
            {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product._id} className={`bg-white rounded-xl shadow-sm overflow-hidden border-2 transition-all ${currentFreshId === product._id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-transparent'}`}>
              <div className="relative h-48 bg-gray-100 p-4">
                <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                {currentFreshId === product._id && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                        <Zap size={12} fill="currentColor" /> ACTIVE SALE
                    </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                <div className="flex justify-between items-center mb-4">
                  {(() => {
                    const po = getPriceForCountry(product, selectedCountry);
                    return <span className="text-lg font-bold text-blue-600">{po.symbol}{po.price}</span>;
                  })()}
                  <div className="flex items-center text-yellow-400 text-sm">
                    <Star size={14} fill="currentColor" /> {product.rating}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                   <button onClick={() => navigate(`/product/${product._id}`)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600 flex justify-center" title="View"><Eye size={18} /></button>
                   <button onClick={() => !isGuestMode && navigate(`/admin/products/update/${product._id}`)} disabled={isGuestMode} className={`p-2 rounded-lg flex justify-center ${isGuestMode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'}`} title={isGuestMode ? 'Guest mode: disabled' : 'Edit'}><Edit size={18} /></button>
                   <button onClick={() => !isGuestMode && handleDelete(product._id)} disabled={isGuestMode} className={`p-2 rounded-lg flex justify-center ${isGuestMode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 hover:bg-red-200 text-red-600'}`} title={isGuestMode ? 'Guest mode: disabled' : 'Delete'}><Trash2 size={18} /></button>
                   <button 
                     onClick={() => !isGuestMode && openFreshModal(product)} 
                     disabled={isGuestMode}
                     title={isGuestMode ? 'Guest mode: disabled' : 'Set as Sale Product'}
                     className={`p-2 rounded-lg flex justify-center transition-colors ${isGuestMode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : currentFreshId === product._id ? 'bg-orange-500 text-white' : 'bg-orange-100 hover:bg-orange-200 text-orange-600'}`}
                   >
                     <Zap size={18} fill={currentFreshId === product._id && !isGuestMode ? "currentColor" : "none"} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sale Modal */}
      {showFreshModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Zap fill="currentColor" /> Configure Sale
              </h3>
              <button onClick={() => setShowFreshModal(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
            </div>
            
              <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                 <img src={selectedFreshProduct?.images?.[0]} alt="" className="w-16 h-16 object-contain bg-gray-50 rounded-lg border" />
                 <div>
                    <p className="font-bold text-gray-800 line-clamp-1">{selectedFreshProduct?.name}</p>
                   {(() => {
                     const sp = selectedFreshProduct ? getPriceForCountry(selectedFreshProduct, selectedCountry) : { symbol: getPriceForCountry({ price: 0 }, selectedCountry).symbol, price: 0 };
                     return <p className="text-sm text-gray-500">Current Price: {sp.symbol}{sp.price}</p>;
                   })()}
                 </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale End Time</label>
                  <input 
                    type="datetime-local" 
                    value={freshConfig.endTime}
                    onChange={e => setFreshConfig({...freshConfig, endTime: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage (%)</label>
                  <input 
                    type="number" 
                    min="1" max="99"
                    value={freshConfig.discount}
                    onChange={e => setFreshConfig({...freshConfig, discount: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-sm text-orange-800">
                  {(() => {
                    const base = getPriceForCountry(selectedFreshProduct || { price: 0 }, selectedCountry).price || 0;
                    const newPrice = base * (1 - (freshConfig.discount || 0) / 100);
                    const currency = getPriceForCountry(selectedFreshProduct || { price: 0 }, selectedCountry);
                    return <p><strong>New Price:</strong> {currency.symbol}{(Math.round(newPrice * 100) / 100).toFixed(2)}</p>;
                  })()}
                </div>
              </div>

              <button 
                onClick={saveFreshSale}
                className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95"
              >
                Launch Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;