import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Truck, Shield, Star, 
  Filter, X, ShoppingCart, Clock, Zap, Mail, Megaphone
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, refreshUserProfile } from '../authSlice';
import { addToCart } from '../cartSlice';
import { fetchAllProducts } from '../productSlice';
import { getPriceForCountry, getCurrencyForCountry, formatConvertedPrice } from '../utils/pricing';
import { CarouselShimmer, ProductGridShimmer, QuadCardsShimmer } from '../components/Shimmer';
import FilterModal from '../components/Filter';

const CategoryCard = ({ title, products, type = "single", navigate, categorySlug, handleProductClick }) => {
    if (!products || products.length === 0) return null;
  
    return (
      <div className="bg-white p-4 flex flex-col justify-between h-full z-10 shadow-lg rounded-xl cursor-pointer hover:shadow-xl transition-shadow border border-blue-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800 line-clamp-2 h-14">{title}</h2>
        
        <div className="flex-grow">
          {type === "grid" && products.length >= 4 ? (
            <div className="grid grid-cols-2 gap-2 h-full">
              {products.slice(0, 4).map((item, idx) => (
                <div key={idx} onClick={() => handleProductClick(item)}>
                  <img 
                    src={item.images?.[0]} 
                    alt={item.name} 
                    className="w-full h-24 object-contain mb-1 p-1 bg-gray-50 rounded-lg"
                  />
                  <p className="text-xs text-gray-600 line-clamp-1">{item.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div onClick={() => handleProductClick(products[0])} className="h-full">
              <img 
                src={products[0].images?.[0]} 
                alt={products[0].name} 
                className="w-full h-64 object-contain mb-2 p-2 bg-gray-50 rounded-lg" 
              />
            </div>
          )}
        </div>
  
        <button 
            onClick={(e) => {
                e.stopPropagation();
                navigate(`/recomendcategory/${categorySlug}`);
            }}
            className="text-sm text-left text-blue-600 font-semibold hover:text-blue-800 hover:underline mt-4 block"
        >
          Explore Category &rarr;
        </button>
      </div>
    );
};

const ProductCarousel = ({ title, products, navigate, handleAddToCart, freshSaleData, handleProductClick, selectedCountry }) => {
    const scrollRef = useRef(null);
  
    const scroll = (direction) => {
      if (scrollRef.current) {
        const { current } = scrollRef;
        const scrollAmount = direction === 'left' ? -500 : 500;
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };
  
    const getPrice = (product) => {
      const priceObj = getPriceForCountry(product, selectedCountry);

      if (freshSaleData && freshSaleData.productId === product._id && freshSaleData.isActive) {
        const discountedAmount = priceObj.price * (1 - freshSaleData.discount / 100);
        const discountedPriceObj = formatConvertedPrice(discountedAmount, selectedCountry);
        return (
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 line-through">{priceObj.symbol}{priceObj.price}</span>
            <span className="text-lg font-bold text-red-600 flex items-center gap-1">
              {discountedPriceObj.symbol}{discountedPriceObj.price} <Zap className="w-3 h-3 fill-current" />
            </span>
          </div>
        );
      }
      return <p className="text-lg font-bold text-blue-700 mb-3">{priceObj.symbol}{priceObj.price}</p>;
    };
  
    if (!products || products.length === 0) return null;
  
    return (
      <div className="bg-white p-6 mb-8 shadow-sm rounded-xl border border-blue-100 relative group mx-4">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
          {title}
        </h3>
        
        <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-blue-200 p-2 rounded-full shadow-lg text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-blue-200 p-2 rounded-full shadow-lg text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50">
          <ChevronRight className="w-6 h-6" />
        </button>
  
        <div ref={scrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((product) => (
            <div key={product._id} className="flex-none w-52 cursor-pointer group/item flex flex-col" onClick={() => handleProductClick(product)}>
              <div className="w-52 h-52 bg-gray-50 flex items-center justify-center mb-3 rounded-xl p-4 border border-transparent group-hover/item:border-blue-200 transition-all relative">
                {freshSaleData?.productId === product._id && freshSaleData.isActive && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md z-10 animate-pulse">
                        -{freshSaleData.discount}% OFF
                    </span>
                )}
                <img src={product.images?.[0]} alt={product.name} className="max-w-full max-h-full object-contain group-hover/item:scale-105 transition-transform duration-300" />
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover/item:text-blue-600 h-10">
                {product.name}
              </p>
              <div className="mb-3 h-12 flex items-center">
                  {getPrice(product)}
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id); }}
                disabled={product.stock === 0}
                className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                    product.stock === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
};

const Homepage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const { user, selectedCountry } = useSelector((state) => state.auth);
  const { allProducts, loading, error } = useSelector((state) => state.products);
  const [showContent, setShowContent] = useState(false);
  const featuredScrollRef = useRef(null);
  const [recentClickedProducts, setRecentClickedProducts] = useState([]);
  const [searchHistoryProducts, setSearchHistoryProducts] = useState([]);
  const [randomCategory, setRandomCategory] = useState('');

  const categoriesList = ['electronics','clothing','books','home','sports','beauty','toys','automotive'];

  const [filters, setFilters] = useState({ category: '', brand: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name', search: '' });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({...filters});
  const [freshSaleData, setFreshSaleData] = useState({ isActive: false, timeString: '00:00:00', productId: null, discount: 0 });
  const [freshProduct, setFreshProduct] = useState(null);
   const [activeTab, setActiveTab] = useState('category');

  useEffect(() => {
    const fetchFreshSale = async () => {
      try {
        const response = await axiosClient.get('/freshsale/current');
        const data = response.data.freshSale;
        
        if (data) {
          setFreshSaleData({
            isActive: true,
            timeString: data.timeString,
            productId: data.productId,
            discount: data.discount
          });
        } else {
          setFreshSaleData({ isActive: false, timeString: '00:00:00', productId: null, discount: 0 });
        }
      } catch (err) {
        // console.error("Error fetching fresh sale:", err);
        setFreshSaleData({ isActive: false, timeString: '00:00:00', productId: null, discount: 0 });
      }
    };

    fetchFreshSale();
    const interval = setInterval(fetchFreshSale, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && !user._id?.startsWith?.('guest')) {
      dispatch(refreshUserProfile());
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    if (user && allProducts.length > 0) {
      const recentClicked = [...(user.clickedProducts || [])];
      const seenRecent = new Set();
      const recentDeduped = [];
      recentClicked.forEach(item => {
        const pid = item.productId?._id ?? item.productId;
        const prod = allProducts.find(p => p._id === pid || String(p._id) === String(pid));
        if (prod && !seenRecent.has(prod._id)) {
          seenRecent.add(prod._id);
          recentDeduped.push(prod);
        }
      });
      setRecentClickedProducts(recentDeduped.slice(0, 4));

      const searchHistory = [...(user.searchHistory || [])];
      const seenSearch = new Set();
      const searchDeduped = [];
      searchHistory.forEach(item => {
        const pid = item.productId?._id ?? item.productId;
        const prod = allProducts.find(p => p._id === pid || String(p._id) === String(pid));
        if (prod && !seenSearch.has(prod._id)) {
          seenSearch.add(prod._id);
          searchDeduped.push(prod);
        }
      });
      setSearchHistoryProducts(searchDeduped.slice(0, 4));
    }
  }, [user, allProducts]);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * categoriesList.length);
    setRandomCategory(categoriesList[randomIdx]);
  }, []);

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setFilters(prev => ({ ...prev, search: searchQuery }));
    }
  }, [searchParams]);

  useEffect(() => {
      if (allProducts.length > 0 && freshSaleData.productId) {
          const found = allProducts.find(p => p._id === freshSaleData.productId);
          setFreshProduct(found);
      }
  }, [allProducts, freshSaleData.productId]);

  const handleShopNow = () => {
    const featuredSection = document.getElementById('featured-products');
    if (featuredSection) featuredSection.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddToCart = async (productId) => {
    if (!user) { navigate('/login'); return; }
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      alert('Added to cart!');
    } catch (error) { alert('Failed: ' + error); }
  };


  const trackSearchHistory = async (query, category = '') => {
    if (!user || !query.trim()) return;
    try {
      await axiosClient.post('/user/searchHistory', { query, category });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  };

  const trackProductClick = async (product) => {
    if (!user) return;
    try {
      await axiosClient.post('/user/clickedProduct', {
        productId: product._id,
        productName: product.name,
        productCategory: product.category
      });
    } catch (error) {
      console.error('Failed to track product click:', error);
    }
  };

  const handleProductClick = async (product) => {
    const searchQuery = searchParams.get('search');
    if (user && searchQuery) {
      try {
        await axiosClient.post('/user/searchHistory', {
          productId: product._id,
          productName: product.name,
          productCategory: product.category,
          searchQuery: searchQuery
        });

        setSearchHistoryProducts(prev => {
          const updated = [product, ...prev.filter(p => p._id !== product._id)];
          return updated.slice(0,4);
        });

        dispatch(updateUser({
          ...user,
          searchHistory: [{ productId: product._id, productName: product.name, productCategory: product.category, searchQuery } , ...(user.searchHistory||[])]
        }));
      } catch (error) {
        console.error('Failed to track search history:', error);
      }
    }
    
    await trackProductClick(product);

    setRecentClickedProducts(prev => {
      const updated = [product, ...prev.filter(p => p._id !== product._id)];
      return updated.slice(0,4);
    });
    if (user) {
      dispatch(updateUser({
        ...user,
        clickedProducts: [{ productId: product._id, clickedAt: new Date(), productName: product.name, productCategory: product.category }, ...(user.clickedProducts||[])]
      }));
    }

    navigate(`/product/${product._id}`);
  };

  const handleCategoryClick = (category) => {
    setFilters({...filters, category});
    if (user) {
      trackSearchHistory(`Category: ${category}`, category);
    }
    navigate(`/category/${category.toLowerCase()}`);
  };
  
  const scrollFeatured = (direction) => {
    if (featuredScrollRef.current) {
      const { current } = featuredScrollRef;
      const scrollAmount = direction === 'left' ? -500 : 500;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openFilterModal = () => { setTempFilters({...filters}); setIsFilterModalOpen(true); };
  const applyFilters = () => { 
    setFilters(tempFilters); 
    setIsFilterModalOpen(false);
    

    if (user && (tempFilters.category || tempFilters.brand || tempFilters.minPrice || tempFilters.maxPrice)) {
      const searchQuery = `Filter: ${tempFilters.category || 'All'} ${tempFilters.brand ? `Brand: ${tempFilters.brand}` : ''} ${tempFilters.minPrice ? `Min: ${getCurrencyForCountry(selectedCountry).symbol}${tempFilters.minPrice}` : ''} ${tempFilters.maxPrice ? `Max: ${getCurrencyForCountry(selectedCountry).symbol}${tempFilters.maxPrice}` : ''}`.trim();
      trackSearchHistory(searchQuery, tempFilters.category || '');
    }
  };
  const clearFilters = () => { setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', minRating: '', sortBy: 'name', search: '' }); setIsFilterModalOpen(false); };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowContent(true), 1000);
      return () => clearTimeout(timer);
    }
    setShowContent(false);
  }, [loading]);

  const filteredProducts = allProducts.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    const productPrice = getPriceForCountry(product, selectedCountry).price;
    if (filters.minPrice && productPrice < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && productPrice > parseFloat(filters.maxPrice)) return false;
    if (filters.minRating && product.rating < parseFloat(filters.minRating)) return false;
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !product.brand?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.category.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'priceLow') return a.price - b.price;
    if (filters.sortBy === 'priceHigh') return b.price - a.price;
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  const uniqueBrands = [...new Set(allProducts.filter(p => p.brand).map(p => p.brand))].sort();
  const uniqueCategories = [...new Set(allProducts.filter(p => p.category).map(p => p.category))].sort();

  const electronics = allProducts.filter(p => p.category?.toLowerCase().includes('electronic') || p.category?.toLowerCase().includes('tech'));
  const home = allProducts.filter(p => p.category?.toLowerCase().includes('home') || p.category?.toLowerCase().includes('appliance'));
  const fashion = allProducts.filter(p => p.category?.toLowerCase().includes('cloth') || p.category?.toLowerCase().includes('fashion'));
  const displayElectronics = electronics.length ? electronics : allProducts.slice(0, 4);
  const displayHome = home.length ? home : allProducts.slice(4, 8);
  const displayFashion = fashion.length ? fashion : allProducts.slice(8, 9);
  const randomCategoryProducts = randomCategory 
    ? allProducts.filter(p => p.category?.toLowerCase().includes(randomCategory.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-blue-50/50 relative">

      {/* TOP FILTER BAR */}
      <section className="bg-white border-b border-blue-100 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex gap-3 items-center">
          <button onClick={openFilterModal} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium transition-colors border border-blue-200 whitespace-nowrap">
            <Filter className="w-4 h-4" /> <span>Filter</span>
          </button>
          <div className="w-px h-8 bg-gray-200 mx-1"></div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-1" style={{ scrollbarWidth: 'none' }}>
             <button onClick={() => {
               setFilters({...filters, category: ''});
               if (user) {
                 trackSearchHistory('All Products', '');
               }
             }} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200">
                All Products
              </button>
            {categoriesList.map((cat) => (
              <button key={cat} onClick={() => handleCategoryClick(cat)} className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-white text-gray-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 hover:text-blue-600">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* HERO + QUAD WRAPPER */}
      <section className="bg-gradient-to-b from-sky-700 text-white relative pb-5">

  {/* HERO */}
        <div className="container mx-auto px-4 text-center pt-20">
          <h1 className="text-5xl font-bold mb-6 drop-shadow-md">
            Welcome to Our Buy Zone
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
            Discover amazing products at unbeatable prices. Shop with confidence and enjoy fast and secure delivery.
          </p>
        </div>

        {/* QUAD CARDS */}
          <div className="container mx-auto px-4 mt-16 relative z-10">
            {loading || !showContent ? (
              <QuadCardsShimmer />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Recent History Card */}
                    <div className="bg-white p-4 flex flex-col justify-between h-full z-10 shadow-lg rounded-xl cursor-pointer hover:shadow-xl transition-shadow border border-blue-100">
                      <h2 className="text-xl font-bold mb-4 text-gray-800 line-clamp-2 h-14">Recent History</h2>
                      <div className="flex-grow">
                        {recentClickedProducts.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {recentClickedProducts.slice(0, 4).map((item, idx) => (
                              <div key={idx} onClick={() => handleProductClick(item)}>
                                <img 
                                  src={item.images?.[0]} 
                                  alt={item.name} 
                                  className="w-full h-24 object-contain mb-1 p-1 bg-gray-50 rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <p className="text-sm">No history yet</p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/history/recent');
                        }}
                        className="text-sm text-left text-blue-600 font-semibold hover:text-blue-800 hover:underline mt-4 block"
                      >
                        View all History &rarr;
                      </button>
                    </div>

                    {/* Search History Card */}
                    <div className="bg-white p-4 flex flex-col justify-between h-full z-10 shadow-lg rounded-xl cursor-pointer hover:shadow-xl transition-shadow border border-blue-100">
                      <h2 className="text-xl font-bold mb-4 text-gray-800 line-clamp-2 h-14">Search History</h2>
                      <div className="flex-grow">
                        {searchHistoryProducts.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 h-full">
                            {searchHistoryProducts.slice(0, 4).map((item, idx) => (
                              <div key={idx} onClick={() => handleProductClick(item)}>
                                <img 
                                  src={item.images?.[0]} 
                                  alt={item.name} 
                                  className="w-full h-24 object-contain mb-1 p-1 bg-gray-50 rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <p className="text-sm">No search history</p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/history/search');
                        }}
                        className="text-sm text-left text-blue-600 font-semibold hover:text-blue-800 hover:underline mt-4 block"
                      >
                        View History &rarr;
                      </button>
                    </div>

                    {/* Random Category Card */}
                    <CategoryCard 
                      title={randomCategory.charAt(0).toUpperCase() + randomCategory.slice(1)} 
                      products={randomCategoryProducts.slice(0, 4)} 
                      categorySlug={randomCategory} 
                      type="grid" 
                      navigate={navigate} 
                      handleProductClick={handleProductClick}
                    />
                    
                    {/* SPONSORSHIP */}
                    <div className="bg-white flex flex-col justify-between h-full shadow-lg rounded-xl border border-blue-100 overflow-hidden relative">
                      

                      <div className="p-4 bg-white border-b border-gray-100 z-20">
                          <h2 className="text-xl font-bold mb-2 text-gray-800 line-clamp-1">
                              {user ? `Welcome back, ${user.firstName}` : 'Sign in for best experience'}
                          </h2>
                          <button 
                              onClick={() => user ? navigate('/profile') : navigate('/login')}
                              className={`w-full text-sm font-semibold py-2.5 rounded-lg shadow-sm transition-colors ${
                                  user 
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                          >
                              {user ? 'My Account' : 'Sign in securely'}
                          </button>
                      </div>


                      <div className="flex-1 p-4 relative flex flex-col justify-center">
                          {freshSaleData.isActive ? (
                              <div className="cursor-pointer group h-full flex flex-col" onClick={() => navigate(`/product/${freshProduct?._id}`)}>
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded border border-red-100 flex items-center gap-1 animate-pulse">
                                          <Zap className="w-3 h-3 fill-current" /> FRESH DEAL
                                      </span>
                                      <div className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {freshSaleData.timeString}
                                      </div>
                                  </div>
              
                                  <div className="relative flex-1 bg-gray-50 rounded-lg p-2 mb-2 flex items-center justify-center overflow-hidden">
                                      <img src={freshProduct?.images?.[0]} alt="Deal" className="max-w-full h-24 object-contain group-hover:scale-110 transition-transform duration-500" />
                                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                          -{freshSaleData.discount}%
                                      </div>
                                  </div>

                                  <div>
                                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1">{freshProduct?.name}</h3>
                                      <div className="flex items-center justify-between">
                                          <div className="flex flex-col">
                                              {freshProduct ? (() => {
                                                const originalPrice = getPriceForCountry(freshProduct, selectedCountry);
                                                const discountedAmount = originalPrice.price * (1 - freshSaleData.discount / 100);
                                                const discountedPrice = formatConvertedPrice(discountedAmount, selectedCountry);
                                                return (
                                                  <>
                                                    <span className="text-[10px] text-gray-400 line-through">Was {originalPrice.symbol}{originalPrice.price}</span>
                                                    <span className="text-lg font-bold text-red-600 leading-none">
                                                      {discountedPrice.symbol}{discountedPrice.price}
                                                    </span>
                                                  </>
                                                );
                                              })() : null}
                                          </div>
                                          <button className="bg-red-100 text-red-600 p-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                              <ShoppingCart className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-dashed border-gray-300 p-4">
                                  <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                      <Megaphone className="w-6 h-6 text-blue-500" />
                                  </div>
                                  <h3 className="font-bold text-gray-700 mb-1">Advertise Here</h3>
                                  <p className="text-xs text-gray-500 mb-4 px-2">
                                      Reach thousands of customers daily. Boost your brand visibility now.
                                  </p>
                                  <button className="text-xs font-bold text-blue-600 border border-blue-200 bg-white px-3 py-1.5 rounded-full hover:bg-blue-50 flex items-center gap-1 transition-colors">
                                      <Mail className="w-3 h-3" /> Contact Sales
                                  </button>
                              </div>
                          )}
                      </div>
                    </div>
                  </div>
            )}
          </div>

      </section>

      {/* FEATURED PRODUCTS */}
      <section id="featured-products" className="py-8 container mx-auto px-4 relative group">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
           <div className="flex items-center gap-4">
             <button onClick={() => navigate('/featured')} className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 hover:underline">
               See All Products <ChevronRight className="w-4 h-4" />
             </button>
           </div>
        </div>
        
        {loading ? (
          <ProductGridShimmer count={6} />
        ) : !showContent ? (
          <ProductGridShimmer count={6} />
        ) : (
          <div className="relative">
             <button onClick={() => scrollFeatured('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 border border-gray-200 p-2 rounded-full shadow-lg text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white -ml-4"><ChevronLeft className="w-6 h-6" /></button>
             <button onClick={() => scrollFeatured('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 border border-gray-200 p-2 rounded-full shadow-lg text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white -mr-4"><ChevronRight className="w-6 h-6" /></button>

             <div ref={featuredScrollRef} className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
               {filteredProducts.map((product) => {
                 const isFresh = freshSaleData.isActive && freshSaleData.productId === product._id;
                 const priceObj = getPriceForCountry(product, selectedCountry);
                 const finalPriceObj = isFresh 
                    ? formatConvertedPrice(priceObj.price * (1 - freshSaleData.discount / 100), selectedCountry)
                    : priceObj;

                 return (
                 <div key={product._id} className={`min-w-[280px] w-[280px] group/card bg-white border rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 ${isFresh ? 'border-red-200 ring-1 ring-red-100' : 'border-blue-100'}`}>
                   <div className="relative bg-gray-50 w-full h-60 rounded-lg mb-4 overflow-hidden cursor-pointer flex items-center justify-center" onClick={() => handleProductClick(product)}>
                     {isFresh && (
                        <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" /> {freshSaleData.timeString}
                        </div>
                     )}
                     <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-contain p-4 group-hover/card:scale-105 transition-transform duration-300" />
                   </div>

                   <div className="text-left">
                     <p className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">{product.category}</p>
                     <h3 className="font-bold text-gray-900 truncate mb-1 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate(`/product/${product._id}`)}>{product.name}</h3>
                     
                     <div className="flex items-center justify-between mt-2">
                       <div className="flex flex-col">
                           {isFresh && <span className="text-xs text-gray-400 line-through">{priceObj.symbol}{priceObj.price}</span>}
                           <span className={`text-xl font-bold ${isFresh ? 'text-red-600' : 'text-gray-900'}`}>{finalPriceObj.symbol}{finalPriceObj.price}</span>
                       </div>
                       <button 
                         disabled={product.stock === 0}
                         onClick={() => handleAddToCart(product._id)}
                         className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${product.stock === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
                       >
                         {product.stock === 0 ? 'Out' : 'Add'}
                       </button>
                     </div>
                   </div>
                 </div>
               )})}
             </div>
          </div>
        )}
      </section>

      {/* CAROUSELS */}
      <div className="container mx-auto pb-10 mt-8">
        {loading || !showContent ? (
          <>
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Recommended For You</h3>
              <CarouselShimmer count={6} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Best Sellers in Home</h3>
              <CarouselShimmer count={6} />
            </div>
          </>
        ) : (
          <>
            <ProductCarousel title="Recommended For You" products={filteredProducts.slice().reverse()} navigate={navigate} handleAddToCart={handleAddToCart} freshSaleData={freshSaleData} handleProductClick={handleProductClick} selectedCountry={selectedCountry} />
            <ProductCarousel title="Best Sellers in Home" products={displayHome.filter(p => filteredProducts.includes(p))}  navigate={navigate} handleAddToCart={handleAddToCart} freshSaleData={freshSaleData} handleProductClick={handleProductClick} selectedCountry={selectedCountry} />
          </>
        )}
      </div>
      
      <section className="py-16 bg-white border-t border-blue-100">
              <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                      <Truck className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Fast Delivery</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Get your orders delivered quickly and safely to your doorstep.</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                      <Shield className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Secure Shopping</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Your personal information and payments are fully protected.</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                      <Star className="w-10 h-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Quality Products</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">We offer only the highest quality products verified by our quality control team.</p>
                  </div>
                </div>
              </div>
            </section>
      
      <section className="bg-gray-900 text-white py-16">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Start Shopping?</h2>
                <p className="text-xl mb-8 text-gray-300">Join thousands of satisfied customers today.</p>
                <div className="space-x-4">
                  <button 
                    onClick={handleShopNow}
                    className="bg-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors shadow-lg hover:shadow-blue-500/50"
                  >
                    Shop Now
                  </button>
                </div>
              </div>
            </section>
      
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
  );
};

export default Homepage;