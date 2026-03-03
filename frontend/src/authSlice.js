import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosClient from './utils/axiosClient'

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
    const response =  await axiosClient.post('/user/register', userData);
    return response.data.user;
    } catch (error) {
      let errorMessage = 'Something went wrong';
      
      if (error.response?.data) {
        errorMessage = error.response.data;

        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('Error:')) {
            errorMessage = errorMessage.split('Error:')[1].trim();
          } else if (errorMessage.includes('Error:')) {
            errorMessage = errorMessage.split('Error:')[1].trim();
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue({ message: errorMessage });
    }
  }
);


export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/user/login', credentials);
      return response.data.user;
    } catch (error) {

      let errorMessage = 'Something went wrong';
      
      if (error.response?.data) {
        errorMessage = error.response.data;
        
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('Error:')) {
            errorMessage = errorMessage.split('Error:')[1].trim();
          } else if (errorMessage.includes('Error:')) {
            errorMessage = errorMessage.split('Error:')[1].trim();
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/check');
      return data?.user;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue(null);
      }
      return rejectWithValue(error);
    }
  }
);

export const refreshUserProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get('/user/profile');
      return data?.user;
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue(null);
      }
      return rejectWithValue(error);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await axiosClient.post('/user/logout');
      return null;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isGuestMode: false,
    loading: false,
    error: null,
    selectedCountry: 'INDIA'
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = action.payload;
    },
    updateSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload;
    },
    enterGuestMode: (state) => {
      state.isGuestMode = true;
      state.user = {
        firstName: 'Guest',
        lastName: 'User',
        emailId: 'guest@demo.com',
        role: 'admin',
        _id: 'guest-demo'
      };
      state.isAuthenticated = false;
    },
    exitGuestMode: (state) => {
      state.isGuestMode = false;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User Cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })
  
      // Login User Cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
        state.isGuestMode = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;  
      })
  
      // Check Auth Cases
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      })

      // Refresh Profile (for history etc)
      .addCase(refreshUserProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
        }
      })
  
      // Logout User Cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isGuestMode = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Something went wrong';
        state.isAuthenticated = false;
        state.user = null;
      });
  }
});

export const { updateUser, updateSelectedCountry, enterGuestMode, exitGuestMode } = authSlice.actions;
export default authSlice.reducer;