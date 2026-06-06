const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

// Initialize express
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TaskFlow API is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend build
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API endpoints:`);
  console.log(`   POST   /api/auth/signup`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/projects`);
  console.log(`   POST   /api/projects`);
  console.log(`   GET    /api/projects/:id`);
  console.log(`   PUT    /api/projects/:id`);
  console.log(`   DELETE /api/projects/:id`);
  console.log(`   POST   /api/projects/:id/members`);
  console.log(`   PUT    /api/projects/:id/members/:userId`);
  console.log(`   DELETE /api/projects/:id/members/:userId`);
  console.log(`   GET    /api/tasks/my`);
  console.log(`   GET    /api/tasks/stats`);
  console.log(`   GET    /api/tasks/project/:projectId`);
  console.log(`   POST   /api/tasks`);
  console.log(`   PUT    /api/tasks/:id`);
  console.log(`   DELETE /api/tasks/:id`);
});
