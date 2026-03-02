import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Trash2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';
import { formatPrice, getPriceForCountry } from '../utils/pricing';

const DeleteProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isGuestMode, selectedCountry } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (isGuestMode) {
      navigate('/admin/products', { state: { message: 'Guest mode: product modifications are disabled.' } });
      return;
    }
    fetchProduct();
  }, [id, isGuestMode, navigate]);

  const fetchProduct = async () => {
    try {
      setFetchLoading(true);
      const response = await axiosClient.get(`/product/getProductById/${id}`);
      setProduct(response.data);
    } catch (error) {
      // console.error('Fetch product error:', error);
      setError('Failed to fetch product details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await axiosClient.delete(`/product/delete/${id}`);
      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
    } catch (error) {
      // console.error('Delete product error:', error);
      setError(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Product not found</p>
          <button
            onClick={() => navigate('/admin/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Delete Product</h1>
              <p className="text-gray-600">Confirm product deletion</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            Product deleted successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Warning Card */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Warning: This action cannot be undone
              </h3>
              <p className="text-yellow-700">
                Deleting this product will permanently remove it from your store.
                This action cannot be reversed.
              </p>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h2>

          <div className="space-y-4">
            {/* Product Image */}
            {product.images && product.images.length > 0 && (
              <div>
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}

            {/* Product Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{product.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Price</label>
                {(() => {
                  const po = getPriceForCountry(product, selectedCountry);
                  return <p className="text-gray-900">{po.symbol}{po.price}</p>;
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-900 capitalize">{product.category}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Stock</label>
                <p className="text-gray-900">{product.stock}</p>
              </div>

              {product.brand && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Brand</label>
                  <p className="text-gray-900">{product.brand}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500">Rating</label>
                <p className="text-gray-900">{product.rating} ({product.numReviews} reviews)</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{product.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {loading ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProduct;
