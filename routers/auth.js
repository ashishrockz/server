// routers/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const EmployeeModel = require('../model/employes'); // Correct the model name

const auth = express.Router();
const secretKey = process.env.JWT_SECRET || 'your-secret-key';

auth.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await EmployeeModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Updated message
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Updated message
    }

    const token = jwt.sign({ id: user._id, role: user.role }, secretKey, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token }); // Updated message
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
});

auth.post('/signup', async (req, res) => {
  try {
    const user = new EmployeeModel(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', err });
  }
});

auth.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
  });
  
module.exports = auth;
