import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Package, Upload, X, Loader2, AlertCircle, CheckCircle, Plus, Star } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';

const CreateProduct = () => {
  const navigate = useNavigate();
  const { isGuestMode } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
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
    brand: '',
    rating: 0
  });

  const categories = ['electronics', 'clothing', 'books', 'home', 'sports', 'beauty', 'toys', 'automotive'];

  useEffect(() => {
    if (isGuestMode) {
      navigate('/admin/products', { state: { message: 'Guest mode: product modifications are disabled.' } });
    }
  }, [isGuestMode, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadImageToCloudinary = async (file) => {
    try {
      // console.log('Getting upload signature...');
      
      const signatureResponse = await axiosClient.get('/media/image/create');
      // console.log('Signature Response:', signatureResponse.data); 

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

      // console.log('Uploading to:', finalUploadUrl);


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
      // console.error(error);
      setError('Failed to upload images. Ensure files are valid images.');
    } finally {
      setUploadingImages(false);
      e.target.value = ''; 
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

      await axiosClient.post('/product/create', productData);

      setSuccess(true);
      setTimeout(() => navigate('/admin/products'), 2000);
    } catch (error) {
      // console.error('Create product error:', error);
      setError(error.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
              <p className="text-gray-600">Add a new product to your store</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            Product created successfully! Redirecting...
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter product name" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter product description" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00" required />
              {/* <p className="text-xs text-gray-500 mt-1">Enter price in $ currency</p> */}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter brand name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Initial Rating (Optional)</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formData.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {formData.rating > 0 ? `${formData.rating} star${formData.rating !== 1 ? 's' : ''}` : 'Not rated'}
                </span>
                {formData.rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: 0 }))}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Images *</label>
              <div className="mb-4">
                <label className="flex items-center gap-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-600 font-medium">Choose Images</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploadingImages} />
                </label>
                {uploadingImages && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading images...
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img src={image} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg border" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/admin/products')} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;