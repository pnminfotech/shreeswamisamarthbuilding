const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const SECRET_KEY = 'your-secret-key'; // Use a secure key

// Register user
const registerUser = async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create new user
      const newUser = new User({ username, email, password });
      await newUser.save();
  
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error); // Log the error
      res.status(500).json({ message: 'Server error' }); // Handle server errors
    }
  };
  
  
  const getUserNAme = async (req, res)=>{
    try  {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Unauthorized" });

      const decoded = jwt.verify(token, SECRET_KEY);
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ username: user.username });
  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
  }

// Login user
const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Avoid leaving the browser waiting until the proxy times out. Proxy timeout
      // responses commonly omit our CORS headers and appear as a misleading CORS error.
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          message: 'Login service is temporarily unavailable. Please try again shortly.',
        });
      }

      const user = await User.findOne({ email: String(email).trim() });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      return res.json({ token });
    } catch (error) {
      console.error('Login failed:', error.message);
      return res.status(500).json({ message: 'Unable to log in right now. Please try again.' });
    }
  };
  

// Protected route to get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

module.exports = { getUserNAme , registerUser, loginUser, getUserProfile };
