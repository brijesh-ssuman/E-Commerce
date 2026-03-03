import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Star, Filter, Loader2, ChevronLeft 
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../cartSlice';
import { fetchAllProducts } from '../productSlice';
import { getPriceForCountry, getCurrencyForCountry } from '../utils/pricing';
import { ProductGridShimmer } from '../components/Shimmer';
import FilterModal from '../components/Filter';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, selectedCountry } = useSelector((state) => state.auth);
  const { allProducts, loading, error } = useSelector((state) => state.products);
  const [showContent, setShowContent] = useState(false);


  const categoriesList = ['electronics','clothing','books','home','sports','beauty','toys','automotive'];

  const [filters, setFilters] = useState({
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'name'
  });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({...filters});
  const [activeTab, setActiveTab] = useState('brand');


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

  // Filter Logic
  const filteredProducts = allProducts.filter(product => {
    if (product.category?.toLowerCase() !== categoryName?.toLowerCase()) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    const productPrice = getPriceForCountry(product, selectedCountry).price;
    if (filters.minPrice && productPrice < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && productPrice > parseFloat(filters.maxPrice)) return false;
    if (filters.minRating && product.rating < parseFloat(filters.minRating)) return false;
    
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'priceLow') return getPriceForCountry(a, selectedCountry).price - getPriceForCountry(b, selectedCountry).price;
    if (filters.sortBy === 'priceHigh') return getPriceForCountry(b, selectedCountry).price - getPriceForCountry(a, selectedCountry).price;
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const currentCategoryProducts = allProducts.filter(p => p.category?.toLowerCase() === categoryName?.toLowerCase());
  const uniqueBrands = [...new Set(currentCategoryProducts.map(p => p.brand).filter(Boolean))];
  const uniqueCategories = [];

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

  const openFilterModal = () => {
    setTempFilters({...filters});
    setIsFilterModalOpen(true);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'name'
    });
    setTempFilters({
      brand: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortBy: 'name'
    });
    setIsFilterModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-blue-50/50">
      
      {/* NAVIGATION BAR */}
      <section className="bg-white border-b border-blue-100 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex gap-3 items-center">
          
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Filter Button */}
          <button 
            onClick={openFilterModal}
            className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200 whitespace-nowrap"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>

          <div className="w-px h-8 bg-gray-200 mx-1"></div>

          {/* Horizontal Category Scroll */}

          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-1" style={{ scrollbarWidth: 'none' }}>
            <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            >
                All
            </button>
            {categoriesList.map((cat) => (
              <button 
                key={cat}
                onClick={() => navigate(`/category/${cat}`)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  categoryName === cat 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HEADER */}
      <div className="bg-blue-500 text-white py-8">
        <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold capitalize">
                {categoryName} Store
            </h1>
            <p className="text-blue-100 mt-2">
                Browse our best collection of {categoryName}
            </p>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
           <p className="text-gray-600">
             Showing {filteredProducts.length} results
           </p>
           
           <select 
             value={filters.sortBy}
             onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
             className="hidden md:block border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
           >
              <option value="name">Name A-Z</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
           </select>
        </div>

        {loading ? (
          <ProductGridShimmer count={8} />
        ) : !showContent ? (
          <ProductGridShimmer count={8} />
        ) : error ? (
          <div className="text-center py-20 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
             <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
             <h3 className="text-xl font-bold text-gray-600">No products found</h3>
             <p className="text-gray-500">Try adjusting your filters or check back later.</p>
             <button onClick={clearFilters} className="mt-4 text-blue-600 font-semibold underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="group bg-white border border-blue-100 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300">
                <div 
                  className="relative bg-gray-50 w-full h-60 rounded-lg mb-4 overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-gray-300" />
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
                      Only {product.stock} left!
                    </span>
                  )}
                </div>

                <div className="text-left">
                  <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">
                    {product.brand}
                  </p>
                  <h3 
                    className="font-bold text-gray-900 truncate mb-1 cursor-pointer hover:text-blue-600 transition-colors" 
                    title={product.name}
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 4) ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">({product.numReviews})</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xl font-bold text-gray-900">{(() => {
                      const priceObj = getPriceForCountry(product, selectedCountry);
                      return `${priceObj.symbol}${priceObj.price}`;
                    })()}</span>
                    <button 
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                        product.stock === 0 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                      }`}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FILTER MODAL */}
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
        showCategoryTab={false}
      />

    </div>
  );
};

export default CategoryPage;