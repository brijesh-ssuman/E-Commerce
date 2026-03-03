import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Star, Filter, X, Check, Loader2, ChevronLeft 
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { getPriceForCountry, formatPrice } from '../utils/pricing';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../cartSlice';

const RecomendCategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, selectedCountry, isGuestMode } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const categoriesList = ['electronics','clothing','books','home','sports','beauty','toys','automotive'];

  const [filters, setFilters] = useState({
    brand: '',
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortBy: 'name'
  });

  // Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({...filters});
  const [activeTab, setActiveTab] = useState('brand');

  // Fetch Data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // For large app /product/getByCategory/${categoryName}
        const response = await axiosClient.get('/product/getAllProducts');
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data || "Failed to fetch products");
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryName]);

  // Filter Logic
  const filteredProducts = products.filter(product => {
    if (product.category?.toLowerCase() !== categoryName?.toLowerCase()) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    const productPriceForCountry = getPriceForCountry(product, selectedCountry).price || 0;
    if (filters.minPrice && productPriceForCountry < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && productPriceForCountry > parseFloat(filters.maxPrice)) return false;
    if (filters.minRating && product.rating < parseFloat(filters.minRating)) return false;
    
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'priceLow') return a.price - b.price;
    if (filters.sortBy === 'priceHigh') return b.price - a.price;
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const currentCategoryProducts = products.filter(p => p.category?.toLowerCase() === categoryName?.toLowerCase());
  const uniqueBrands = [...new Set(currentCategoryProducts.map(p => p.brand).filter(Boolean))];

  const handleAddToCart = async (productId) => {
    if (!user && !isGuestMode) {
      navigate('/login');
      return;
    }
    try {
      if (isGuestMode) {
        await dispatch({ type: 'cart/addLocalItem', payload: { productId, quantity: 1 } });
        alert('Added to cart (guest)!');
      } else {
        await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
        alert('Added to cart!');
      }
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
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading {categoryName}...</p>
          </div>
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
                    {(() => {
                      const po = getPriceForCountry(product, selectedCountry);
                      return <span className="text-xl font-bold text-gray-900">{po.symbol}{po.price}</span>;
                    })()}
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
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Filter {categoryName}</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                {['brand', 'price', 'rating'].map(tab => (
                    <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium border-l-4 transition-colors capitalize ${activeTab === tab ? 'bg-white border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:bg-gray-100'}`}
                    >
                    {tab}
                    </button>
                ))}
              </div>

              <div className="w-2/3 p-6 overflow-y-auto bg-white">
                
                {/* BRAND OPTIONS */}
                {activeTab === 'brand' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 mb-2">Select Brand</h4>
                    {uniqueBrands.length > 0 ? uniqueBrands.map(brand => (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${tempFilters.brand === brand ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                           {tempFilters.brand === brand && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={tempFilters.brand === brand}
                          onChange={() => setTempFilters({...tempFilters, brand: tempFilters.brand === brand ? '' : brand})}
                        />
                        <span className="text-sm">{brand}</span>
                      </label>
                    )) : (
                        <p className="text-sm text-gray-400">No brands found for this category.</p>
                    )}
                  </div>
                )}

                {/* PRICE OPTIONS */}
                {activeTab === 'price' && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 mb-2">Price Range</h4>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Minimum Price</label>
                      <input 
                        type="number"
                        placeholder="0"
                        value={tempFilters.minPrice}
                        onChange={(e) => setTempFilters({...tempFilters, minPrice: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Maximum Price</label>
                      <input 
                        type="number"
                        placeholder="10000"
                        value={tempFilters.maxPrice}
                        onChange={(e) => setTempFilters({...tempFilters, maxPrice: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* RATING OPTIONS */}
                {activeTab === 'rating' && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 mb-2">Minimum Rating</h4>
                    {[4, 3, 2, 1].map((star) => (
                      <label key={star} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${tempFilters.minRating === String(star) ? 'border-blue-600' : 'border-gray-300'}`}>
                           {tempFilters.minRating === String(star) && <div className="w-3 h-3 bg-blue-600 rounded-full"></div>}
                        </div>
                        <input 
                          type="radio" 
                          name="rating"
                          className="hidden"
                          checked={tempFilters.minRating === String(star)}
                          onChange={() => setTempFilters({...tempFilters, minRating: String(star)})}
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold">{star}+ Stars</span>
                          <div className="flex text-yellow-400">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`w-3 h-3 ${i < star ? 'fill-current' : 'text-gray-300'}`} />
                             ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={clearFilters} className="px-6 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200">Clear</button>
              <button onClick={applyFilters} className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700">APPLY FILTER</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RecomendCategoryPage;