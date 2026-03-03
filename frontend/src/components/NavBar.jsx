import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from "react-router-dom"; 
import { useDispatch, useSelector } from "react-redux";
import { 
  Search, 
  ShoppingCart, 
  User, 
  LogOut,
  UserCircle,
  Shield,
  Plus,
  Package,
  ClipboardList,
  Eye
} from 'lucide-react';
import { logoutUser, enterGuestMode, exitGuestMode } from '../authSlice';
import { fetchCart,clearCart } from '../cartSlice';
import axiosClient from '../utils/axiosClient';
import { getPriceForCountry, getCurrencyForCountry, formatPrice } from '../utils/pricing';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, selectedCountry, isGuestMode } = useSelector((state) => state.auth);
  const { items = [], total } = useSelector((state) => state.cart);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [currentFreshSale, setCurrentFreshSale] = useState(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (user && !isGuestMode) {
      dispatch(fetchCart());
    }
  }, [dispatch, user, isGuestMode]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosClient.get('/product/getAllProducts');
        setAllProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCurrentFreshSale = async () => {
      try {
        const response = await axiosClient.get('/freshsale/current');
        const data = response.data.freshSale;
        setCurrentFreshSale(data);
      } catch (error) {
        console.error('Failed to fetch current fresh sale:', error);
        setCurrentFreshSale(null);
      }
    };
    fetchCurrentFreshSale();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (isGuestMode) {
      dispatch(exitGuestMode());
    } else {
      dispatch(logoutUser());
      dispatch(clearCart());
    }
    setIsDropdownOpen(false);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearchDropdownOpen(query.length > 0);
  };

  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (user) {
        try {
          await axiosClient.post('/user/searchHistory', { 
            query: searchQuery.trim(), 
            category: '' 
          });
        } catch (error) {
          console.error('Failed to track search:', error);
        }
      }
      

      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchDropdownOpen(false);
      setSearchQuery('');
    }
  };

  const filteredProducts = allProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductClick = async (productId) => {
    const product = allProducts.find(p => p._id === productId);
    
    if (user && product) {
      try {
        await axiosClient.post('/user/searchHistory', { 
          productId: product._id,
          productName: product.name,
          productCategory: product.category,
          searchQuery: searchQuery.trim() || ''
        });
      } catch (error) {
        console.error('Failed to track search history:', error);
      }
    }
    
    navigate(`/product/${productId}`);
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?'
    const trimmed = name.trim()
    if (!trimmed) return '?'
    return trimmed[0].toUpperCase()
  }

  
  const getDiscountedTotal = () => {
    if (!items || items.length === 0) return 0;
    
    return items.reduce((total, item) => {
      const product = item.productId || {};
      const originalPrice = getPriceForCountry(product, selectedCountry).price || 0;
      const hasSale = currentFreshSale && currentFreshSale.productId === product._id;
      const finalPrice = hasSale ? originalPrice * (1 - currentFreshSale.discount / 100) : originalPrice;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          
           {/* Brand Logo  */}
          <div className="flex-shrink-0">
            <NavLink to="/" className="group flex flex-col items-start transition-transform hover:scale-105">
              <span className="text-2xl font-black tracking-tighter text-blue-600 group-hover:text-blue-700">
                  BUYZONE
              </span>
              <div className="flex items-center gap-1 -mt-1.5">
                <span className="text-[10px] font-medium text-gray-500 italic uppercase tracking-widest">
                  Shop Smart
                </span>
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              </div>
            </NavLink>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl group" ref={searchRef}>
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search products, brands and more..." 
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchSubmit}
                className="w-full h-11 pl-12 pr-4 bg-gray-100 border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
              
              {/* Search Dropdown */}
              {isSearchDropdownOpen && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No img</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {product.category} • {(() => { const po = getPriceForCountry(product, selectedCountry); return `${po.symbol}${po.price}`; })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isSearchDropdownOpen && filteredProducts.length === 0 && searchQuery.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No products found matching "{searchQuery}"
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Login Buttons */}

          {/* Login Buttons */}
        <div className="flex items-center gap-2 md:gap-5">
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="group flex items-center gap-2 bg-white border border-gray-200 p-1.5 pl-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 active:scale-95"
                >
                  <div className="flex flex-col items-start mr-1 text-left">
                    <span className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {user.firstName || 'User'}
                    </span>
                  </div>

                  <div className="relative bg-blue-50 group-hover:bg-blue-600 w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center">
                    <span className="font-black text-sm text-blue-600 group-hover:text-white uppercase transition-colors">
                      {getInitials(user.firstName)}
                    </span>
                  </div>
                </button>

                {/* Custom Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-5 py-4 border-b border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isGuestMode ? 'Guest Mode' : 'Account info'}</p>
                      <p className="text-sm font-black text-gray-800 mt-1">{user.firstName} {user.lastName || ''}</p>
                      <p className="text-xs text-gray-500 truncate">{user.emailId}</p>
                      <p className="text-xs text-blue-500">Role: {user.role}</p>
                      {isGuestMode && (
                        <p className="text-[10px] text-amber-600 font-medium mt-1">Demo preview • No real data</p>
                      )}
                    </div>

                    <div className="p-2">
                      <NavLink 
                        to="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                      >
                        <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                        My Profile
                      </NavLink>

                      <NavLink 
                        to="/orders"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                      >
                        <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                        My Orders
                      </NavLink>

                      {user.role === 'admin' && (
                        <>
                          <NavLink 
                            to="/admin/products" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors group"
                          >
                            <Shield className="w-5 h-5 text-gray-400 group-hover:text-purple-500" />
                            Admin Panel
                          </NavLink>

                          <NavLink
                            to="/admin/orders"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                          >
                            <ClipboardList className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                            User Orders
                          </NavLink>

                          <div className="h-[1px] bg-gray-50 my-2 mx-2"></div>

                          <div className="px-3 py-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Product Management</p>
                            <div className="space-y-1">
                              {!isGuestMode && (
                                <NavLink 
                                  to="/admin/products/create" 
                                  onClick={() => setIsDropdownOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors group"
                                >
                                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                                  Create Product
                                </NavLink>
                              )}
                              <NavLink 
                                to="/admin/products" 
                                onClick={() => setIsDropdownOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                              >
                                <Package className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                Manage Products
                              </NavLink>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="h-[1px] bg-gray-50 my-2 mx-2"></div>

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors group text-left"
                      >
                        <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                        {isGuestMode ? 'Exit Guest Mode' : 'Logout'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Non-logged in state - Guest Mode and Sign In side by side */
              <div className="flex items-center gap-2">
                <span
                  onClick={() => dispatch(enterGuestMode())}
                  className="group relative flex items-center gap-2 bg-amber-50 border border-amber-200 p-4 pl-4 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-300 hover:bg-amber-100 transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  <Eye className="w-5 h-5 text-amber-600 group-hover:text-amber-700" />
                  <span className="text-sm font-extrabold text-amber-800 group-hover:text-amber-900 transition-colors">
                    Guest Mode
                  </span>
                </span>
                <NavLink 
                  to="/login" 
                  className="group relative flex items-center gap-2 bg-white border border-gray-200 p-1.5 pl-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 active:scale-95"
                >
                  <span className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Sign In
                  </span>
                  <div className="bg-gray-50 group-hover:bg-blue-600 p-2.5 rounded-xl transition-all duration-300">
                    <User className="w-5 h-5 text-gray-600 group-hover:text-white transition-transform group-hover:scale-110" />
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <NavLink 
            to="/cart" 
            className="group relative flex items-center gap-2 bg-white border border-gray-200 p-1.5 pl-4 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 active:scale-95"
          >
            <div className="flex flex-col items-start mr-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                My Cart
              </span>
              <span className="text-sm font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                {formatPrice(getDiscountedTotal(), selectedCountry)}
              </span>
            </div>

            <div className="relative bg-gray-50 group-hover:bg-blue-600 p-2.5 rounded-xl transition-colors duration-300">
              <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-white transition-all duration-300" />
            </div>
          </NavLink>
        </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;