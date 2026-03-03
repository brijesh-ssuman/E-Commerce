import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star, ShoppingCart, Truck, Shield, ArrowLeft,
  Minus, Plus, Loader2, AlertCircle, MessageSquare,
  Send, Edit3, Trash2, User
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { addToCart } from '../cartSlice';
import { fetchProductById } from '../productSlice';
import { updateUser } from '../authSlice';
import { getPriceForCountry, getCurrencyForCountry, formatConvertedPrice } from '../utils/pricing';
import { ProductDetailsShimmer } from '../components/Shimmer';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, selectedCountry } = useSelector((state) => state.auth);
  const { currentProduct, loading, error } = useSelector((state) => state.products);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [freshSaleData, setFreshSaleData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
      fetchReviews();
      fetchFreshSale();
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (user && currentProduct && !user._id?.startsWith?.('guest')) {
      const trackView = async () => {
        try {
          await axiosClient.post('/user/clickedProduct', {
            productId: currentProduct._id,
            productName: currentProduct.name,
            productCategory: currentProduct.category
          });
          const pid = currentProduct._id;
          const existing = (user.clickedProducts || []).filter(
            p => String(p.productId?._id ?? p.productId) !== String(pid)
          );
          dispatch(updateUser({
            ...user,
            clickedProducts: [{
              productId: pid,
              clickedAt: new Date(),
              productName: currentProduct.name,
              productCategory: currentProduct.category
            }, ...existing]
          }));
        } catch (err) {
          console.error('Failed to track product view:', err);
        }
      };
      trackView();
    }
  }, [currentProduct?._id, user?._id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axiosClient.get(`/review/product/${id}`);
      setReviews(response.data);
      setReviewsLoading(false);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setReviewsLoading(false);
    }
  };

  const fetchFreshSale = async () => {
    try {
      const response = await axiosClient.get('/freshsale/current');
      setFreshSaleData(response.data.freshSale);
    } catch (err) {
      console.error('Failed to fetch fresh sale:', err);
      setFreshSaleData(null);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!currentProduct || currentProduct.stock === 0) return;

    try {
      setAddingToCart(true);
      await dispatch(addToCart({ productId: currentProduct._id, quantity })).unwrap();
      alert('Added to cart successfully!');
    } catch (error) {
      alert('Failed to add to cart: ' + error);
    } finally {
      setAddingToCart(false);
    }
  };

  const updateQuantity = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= currentProduct.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmittingReview(true);
      const reviewData = {
        productId: id,
        rating: reviewRating,
        comment: reviewComment.trim()
      };

      if (editingReview) {
        await axiosClient.put(`/review/update/${editingReview._id}`, {
          rating: reviewRating,
          comment: reviewComment.trim()
        });
      } else {
        await axiosClient.post('/review/create', reviewData);
      }


      const [reviewsResponse, productResponse] = await Promise.all([
        axiosClient.get(`/review/product/${id}`),
        axiosClient.get(`/product/getProductById/${id}`)
      ]);

      setReviews(reviewsResponse.data);
      setReviewComment('');
      setReviewRating(5);
      setShowReviewForm(false);
      setEditingReview(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await axiosClient.delete(`/review/delete/${reviewId}`);
      const [reviewsResponse, productResponse] = await Promise.all([
        axiosClient.get(`/review/product/${id}`),
        axiosClient.get(`/product/getProductById/${id}`)
      ]);

      setReviews(reviewsResponse.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const cancelReviewForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setReviewComment('');
    setReviewRating(5);
  };

  if (loading) {
    return <ProductDetailsShimmer />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Product not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {currentProduct.images && currentProduct.images.length > 0 ? (
                  <img
                    src={currentProduct.images[selectedImage]}
                    alt={currentProduct.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ShoppingCart className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {currentProduct.images && currentProduct.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {currentProduct.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${currentProduct.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="mb-4">
                <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider mb-2">
                  {currentProduct.category}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentProduct.name}
                </h1>
                {currentProduct.brand && (
                  <p className="text-lg text-gray-600 mb-4">by {currentProduct.brand}</p>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(currentProduct.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {currentProduct.rating} ({currentProduct.numReviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                {(() => {
                  const priceObj = getPriceForCountry(currentProduct, selectedCountry);
                  const isFreshSale = freshSaleData && freshSaleData.productId === currentProduct._id && freshSaleData.isActive;
                  
                  if (isFreshSale) {
                    const discountedAmount = priceObj.price * (1 - freshSaleData.discount / 100);
                    const discountedPrice = formatConvertedPrice(discountedAmount, selectedCountry);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl text-gray-400 line-through">{priceObj.symbol}{priceObj.price}</span>
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold text-sm">
                            -{freshSaleData.discount}% OFF
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-red-600">{discountedPrice.symbol}{discountedPrice.price}</span>
                      </div>
                    );
                  }
                  
                  return <span className="text-4xl font-bold text-gray-900">{priceObj.symbol}{priceObj.price}</span>;
                })()}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {currentProduct.stock > 0 ? (
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                    <span className="font-medium">In Stock ({currentProduct.stock} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              {currentProduct.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(quantity + 1)}
                      disabled={quantity >= currentProduct.stock}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={currentProduct.stock === 0 || addingToCart}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2 ${
                  currentProduct.stock === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : addingToCart
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : currentProduct.stock === 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <Truck className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Free Delivery</h3>
                <p className="text-sm text-gray-600">Free shipping on orders over $50</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Secure Payment</h3>
                <p className="text-sm text-gray-600">100% secure payment processing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {currentProduct.description}
            </p>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
            </div>
            {user && !reviews.some(review => review.user._id === user._id) && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Write Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {editingReview ? 'Edit Review' : 'Write a Review'}
              </h3>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {reviewRating} star{reviewRating !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Share your thoughts about this product..."
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {editingReview ? 'Update Review' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelReviewForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {review.user.name}
                          </span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    {user && review.user._id === user._id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Edit review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
            <p className="text-gray-600 capitalize">{currentProduct.category}</p>
          </div>
          {currentProduct.brand && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Brand</h3>
              <p className="text-gray-600">{currentProduct.brand}</p>
            </div>
          )}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Stock</h3>
            <p className="text-gray-600">{currentProduct.stock} units available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;