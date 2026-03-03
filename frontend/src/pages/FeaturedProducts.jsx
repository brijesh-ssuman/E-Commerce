import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Star, Filter } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../cartSlice';
import { fetchAllProducts } from '../productSlice';
import { getPriceForCountry, getCurrencyForCountry } from '../utils/pricing';
import { ProductGridShimmer } from '../components/Shimmer';
import FilterModal from '../components/Filter';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, selectedCountry } = useSelector((state) => state.auth);
  const { allProducts, loading, error } = useSelector((state) => state.products);
  const [showContent, setShowContent] = useState(false);

  const [filters, setFilters] = useState({ category: '', brand: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name' });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({...filters});
  const [activeTab, setActiveTab] = useState('category');

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowContent(true), 1000);
      return () => clearTimeout(timer);
    }
    setShowContent(false);
  }, [loading]);

  const handleAddToCart = async (productId) => {
    if (!user) return navigate('/login');
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      alert('Added to cart!');
    } catch (err) {
      alert('Failed: ' + err);
    }
  }

  const openFilterModal = () => { setTempFilters({...filters}); setIsFilterModalOpen(true); };
  const applyFilters = () => { setFilters(tempFilters); setIsFilterModalOpen(false); };
  const clearFilters = () => { setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name' }); setIsFilterModalOpen(false); };
  const uniqueBrands = [...new Set(allProducts.filter(p => p.brand).map(p => p.brand))].sort();
  const uniqueCategories = [...new Set(allProducts.filter(p => p.category).map(p => p.category))].sort();

  const filteredProducts = allProducts.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    const productPrice = getPriceForCountry(product, selectedCountry).price;
    if (filters.minPrice && productPrice < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && productPrice > parseFloat(filters.maxPrice)) return false;
    if (filters.minRating && product.rating < parseFloat(filters.minRating)) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'priceLow') return a.price - b.price;
    if (filters.sortBy === 'priceHigh') return b.price - a.price;
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  if (loading) return <ProductGridShimmer count={8} />
  if (error) return <div className="py-20 text-center text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">All Products</h2>
        <button 
          onClick={openFilterModal}
          className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200"
        >
          <Filter className="w-4 h-4" /> <span>Filter</span>
        </button>
      </div>
      {!showContent ? (
        <ProductGridShimmer count={8} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
          <div key={p._id} className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
            <div className="w-full h-48 bg-gray-50 flex items-center justify-center mb-3 rounded-lg cursor-pointer" onClick={() => navigate(`/product/${p._id}`)}>
              {p.images && p.images.length ? (
                <img src={p.images[0]} alt={p.name} className="max-h-full max-w-full object-contain p-4" />
              ) : (
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{p.name}</p>
            <div className="flex items-center justify-between gap-2 mt-4">
            <p className="text-lg font-bold text-blue-700 mb-2">{(() => {
              const priceObj = getPriceForCountry(p, selectedCountry);
              return `${priceObj.symbol}${priceObj.price}`;
            })()}</p>
              <button
                onClick={() => handleAddToCart(p._id)}
                disabled={p.stock === 0}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${p.stock === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tempFilters={tempFilters}
        setTempFilters={setTempFilters}
        uniqueCategories={uniqueCategories}
        uniqueBrands={uniqueBrands}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
      />
    </div>
  )
}

export default FeaturedProducts;
