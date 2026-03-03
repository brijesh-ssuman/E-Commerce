const redisClient = require("../config/redisDB")
const User = require("../model/user")
const validate = require('../utils/validator')
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

// Register the user

const Register = async (req,res)=>{
    
    try{

      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);

      const userCount = await User.countDocuments();
      req.body.role = userCount === 0 ? 'admin' : 'user';
    
    const user =  await User.create(req.body);
    const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
    const fullUser = await User.findById(user._id).select('-password');
    
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).json({
        user: fullUser,
        message:"Login Successfully"
    })
    }
    catch(err){
        res.status(400).send("Error1: "+err.message);
    }
}

// Login User

const Login = async (req,res)=>{
    
    try {
        const {emailId,password} = req.body;

        if(!emailId)
            throw new Error("Invalid Email")
        if(!password)
            throw new Error("Invalid password")

        const user = await User.findOne({emailId})

        if(!user)
            throw new Error("Invalid Username and Password")

        const matchpass = await bcrypt.compare(password,user.password)
        
        if(!matchpass)
            throw new Error("Invalid Username and Password")

        const token = jwt.sign({_id:user._id,emailId:user.emailId, role:user.role},process.env.JWT_KEY,{expiresIn:60*60})
        // populate histories optionally if needed later
        const fullUser = await User.findById(user._id).select('-password');
        res.cookie("token",token,{maxAge:60*60*1000})

        res.json({
            user: fullUser,
            message:"Login Successfully"
        })
    } catch (error) {
        res.status(400).send("Error: " + error.message)
    }
}

// Logout the User

const Logout = async (req,res) => {
    try {
        const {token} = req.cookies;
        const payload = jwt.decode(token)

        await redisClient.set(`token:${token}`,'Blocked')
        await redisClient.expireAt(`token:${token}`,payload.exp)

        res.cookie('token',null,{expires: new Date(Date.now())})
        res.send("User Logout Successfully")
    } catch (err) {
        res.send('Error:'+err.message)
    }
}

// Delete Profile

const deleteProfile = async (req,res) => {
    try {
        const userId = req.result._id;

        await User.findByIdAndDelete(userId)

        res.send("Deleted Profile Successfully")
    } catch (error) {
        res.send('Error:'+error.message)
    }
}

// User Presence 
const checkUser = async (req,res) => {
    try {
        const userId = req.result._id;
        const user = await User.findById(userId)
            .select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user, message: 'Valid User' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// User Profile 

const getUserProfile = async (req, res) => {
    try {
        const userId = req.result._id;

        const user = await User.findById(userId)
            .populate({
                path: 'cart.productId',
                select: 'title price image category' 
            })
            .populate('orders')
            .populate({
                path: 'searchHistory.productId',
                select: 'name price images category'
            })
            .select('-password');
        
        if (!user) {
            return res.status(404).send("User not found");
        }

        res.json({
            user: user,
            cartCount: user.cart ? user.cart.length : 0,
            orderCount: user.orders ? user.orders.length : 0,
            searchHistoryCount: user.searchHistory ? user.searchHistory.length : 0,
            clickedProductsCount: user.clickedProducts ? user.clickedProducts.length : 0
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
};

// Update User Profile

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        const { firstName, lastName, phone, address } = req.body;

        const updateData = {};
        if (firstName !== undefined && firstName !== '') updateData.firstName = firstName;
        if (lastName !== undefined && lastName !== '') updateData.lastName = lastName;
        if (phone !== undefined && phone !== '') updateData.phone = phone;


        if (address !== undefined) {
            const addressData = {};
            if (address.street !== undefined && address.street !== '') addressData.street = address.street;
            if (address.city !== undefined && address.city !== '') addressData.city = address.city;
            if (address.state !== undefined && address.state !== '') addressData.state = address.state;
            if (address.zipCode !== undefined && address.zipCode !== '') addressData.zipCode = address.zipCode;
            if (address.country !== undefined && address.country !== '') addressData.country = address.country;

            if (Object.keys(addressData).length > 0) {
                updateData.address = addressData;
            }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.json({
            user: user,
            message: "Profile updated successfully"
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
};

// Add Search History
const addSearchHistory = async (req, res) => {
    try {
        const userId = req.result._id;
        const { productId, productName, productCategory, searchQuery } = req.body;

        if (!productId || !productName) {
            return res.status(400).send("Product ID and name are required");
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send("Invalid product ID format");
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        user.searchHistory = user.searchHistory.filter(item => 
            item.productId && item.productName
        );


        const existingIndex = user.searchHistory.findIndex(
            item => item.productId && item.productId.toString() === productId
        );

        const newSearchItem = {
            productId,
            productName,
            productCategory: productCategory || '',
            searchQuery: searchQuery || '',
            searchedAt: new Date()
        };

        if (existingIndex !== -1) {

            user.searchHistory[existingIndex] = newSearchItem;
            const [item] = user.searchHistory.splice(existingIndex, 1);
            user.searchHistory.unshift(item);
        } else {
            user.searchHistory.unshift(newSearchItem);
            if (user.searchHistory.length > 50) {
                user.searchHistory = user.searchHistory.slice(0, 50);
            }
        }

        await user.save();

        res.json({ message: "Search history updated successfully" });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
};

// Add Clicked Product History

const addClickedProduct = async (req, res) => {
    try {
        const userId = req.result._id;
        const { productId, productName, productCategory } = req.body;

        if (!productId) {
            return res.status(400).send("Product ID is required");
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        const newClick = {
            productId,
            productName: productName || '',
            productCategory: productCategory || '',
            clickedAt: new Date()
        };

        user.clickedProducts = user.clickedProducts.filter(
            p => p.productId && p.productId.toString() !== productId.toString()
        );
        user.clickedProducts.unshift(newClick);
        if (user.clickedProducts.length > 100) {
            user.clickedProducts = user.clickedProducts.slice(0, 100);
        }

        
        await user.save();

        res.json({ message: "Product click tracked successfully" });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
};

module.exports = {Register,Login,Logout,deleteProfile,checkUser,getUserProfile,updateUserProfile,addSearchHistory,addClickedProduct};
