import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Package,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';

const UpdateProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isGuestMode } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    brand: ''
  });

  const categories = [
    'electronics',
    'clothing',
    'books',
    'home',
    'sports',
    'beauty',
    'toys',
    'automotive'
  ];

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
      const product = response.data;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        stock: product.stock?.toString() || '',
        brand: product.brand || ''
      });

      setImages(product.images || []);
    } catch (error) {
      // console.error('Fetch product error:', error);
      setError('Failed to fetch product details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadImageToCloudinary = async (file) => {
      try {
        console.log('Getting upload signature...');
        
        const signatureResponse = await axiosClient.get('/media/image/create');
        console.log('Signature Response:', signatureResponse.data);
  
        if (signatureResponse.data.error) {
          throw new Error(signatureResponse.data.error);
        }
  
        const { 
          signature, 
          timestamp, 
          public_id, 
          api_key, 
          upload_url, 
          folder, 
          cloud_name 
        } = signatureResponse.data;
  

        if (public_id === 'mock_public_id') {
          return `https://via.placeholder.com/300x200?text=Mock+Image+${Date.now()}`;
        }
  

        let finalUploadUrl = upload_url;
        if (!finalUploadUrl && cloud_name) {
          finalUploadUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
        }
  
        if (!finalUploadUrl) {
          throw new Error("Cloudinary configuration missing. Could not determine upload URL.");
        }
  
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append('file', file);
        cloudinaryFormData.append('signature', signature);
        cloudinaryFormData.append('timestamp', timestamp);
        cloudinaryFormData.append('public_id', public_id);
        cloudinaryFormData.append('api_key', api_key);
        
        if (folder) {
          cloudinaryFormData.append('folder', folder);
        }
  
        console.log('Uploading to:', finalUploadUrl);
  
        const uploadResponse = await axios.post(finalUploadUrl, cloudinaryFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
  
        const uploadResult = uploadResponse.data;
  
        await axiosClient.post('/media/image/save', {
          cloudinaryPublicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url
        });
  
        return uploadResult.secure_url;
      } catch (error) {
        // console.error('Image upload error:', error);
        const errMsg = error.response?.data?.error?.message || error.message || "Upload failed";
        throw new Error(errMsg);
      }
    };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    setError(null);

    try {
      const uploadPromises = files.map(file => uploadImageToCloudinary(file));
      const secureUrls = await Promise.all(uploadPromises);

      setImages(prev => [...prev, ...secureUrls]);
    } catch (error) {
      setError('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.stock) {
      setError('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one product image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images
      };

      await axiosClient.put(`/product/update/${id}`, productData);

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
    } catch (error) {
      // console.error('Update product error:', error);
      setError(error.response?.data?.message || 'Failed to update product');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Edit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Update Product</h1>
              <p className="text-gray-600">Modify product information</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            Product updated successfully! Redirecting...
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand name"
              />
            </div>

            {/* Image Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images *
              </label>

              {/* Upload Button */}
              <div className="mb-4">
                <label className="flex items-center gap-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">Add More Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </label>
                {uploadingImages && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading images...
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Edit className="w-4 h-4" />
              )}
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProduct;
