import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllProducts } from '../productSlice';
import { refreshUserProfile } from '../authSlice';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { addToCart } from '../cartSlice';
import { getPriceForCountry, formatConvertedPrice } from '../utils/pricing';

const SearchHistoryPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, selectedCountry } = useSelector((state) => state.auth);
  const { allProducts, loading: productsLoading } = useSelector((state) => state.products);
  const [searchProducts, setSearchProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user._id?.startsWith?.('guest')) {
      dispatch(refreshUserProfile());
    }
    if (allProducts.length === 0) {
      dispatch(fetchAllProducts());
    }
  }, [user, allProducts.length, navigate, dispatch]);

  useEffect(() => {
    if (!user) return;
    if (allProducts.length === 0 && !productsLoading) {
      setLoading(false);
      return;
    }
    if (allProducts.length === 0) return;
    const history = [...(user.searchHistory || [])];
    const seen = new Set();
    const searchHistoryProducts = [];
    history.forEach(item => {
      const pid = item.productId?._id ?? item.productId;
      const prod = allProducts.find(p => p._id === pid || String(p._id) === String(pid));
      if (prod && !seen.has(prod._id)) {
        seen.add(prod._id);
        searchHistoryProducts.push(prod);
      }
    });
    setSearchProducts(searchHistoryProducts.slice(0, 20));
    setLoading(false);
  }, [user, allProducts, productsLoading]);

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      alert('Added to cart!');
    } catch (error) {
      alert('Failed: ' + error);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`);
  };

  return (
    <div className="min-h-screen bg-blue-50/50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Search History</h1>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {searchProducts.length} items
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : searchProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-blue-100">
            <p className="text-gray-500 mb-4">No search history yet</p>
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 font-semibold hover:text-blue-800"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-blue-100"
              >
                {/* Product Image */}
                <div
                  className="bg-gray-50 h-48 flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => handleProductClick(product)}
                >
                  <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">
                    {product.category}
                  </p>
                  {/*<h3
                    className="font-bold text-gray-900 line-clamp-2 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleProductClick(product)}
                  >
                    {product.name}
                  </h3>*/}

                  {/* Brand & Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <p className="text-xs text-gray-500">{product.brand || 'Brand'}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {getPriceForCountry(product, selectedCountry).symbol}
                        {getPriceForCountry(product, selectedCountry).price}
                      </p>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product._id)}
                    disabled={product.stock === 0}
                    className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      product.stock === 0
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistoryPage;
