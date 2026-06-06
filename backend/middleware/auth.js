const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Check if user is member of project
const projectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    req.project = project;
    req.userRole = project.getUserRole(req.user._id);
    next();
  } catch (error) {
    console.error('Project member check error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is admin of project
const projectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.project = project;
    req.userRole = 'admin';
    next();
  } catch (error) {
    console.error('Project admin check error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, projectMember, projectAdmin };
