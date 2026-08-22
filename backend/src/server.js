require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Strictly allow ALL CRUD Methods (GET, POST, PUT, DELETE)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Database Connection
connectDB();

// CRUD API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Root
app.get('/', (req, res) => {
  res.send('LinkNest API is running with proper CRUD Architecture...');
});

// FIX: Express 5 compatibility. Replaced '/api/*' with '/api'
// Yeh automatically kisi bhi unhandled /api/... request ko catch kar lega.
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));