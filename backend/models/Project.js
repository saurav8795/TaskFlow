const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema]
}, {
  timestamps: true
});

// Index for faster queries
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ createdBy: 1 });

// Check if user is a member
projectSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// Get user's role in project
projectSchema.methods.getUserRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

// Check if user is admin
projectSchema.methods.isAdmin = function(userId) {
  return this.getUserRole(userId) === 'admin';
};

module.exports = mongoose.model('Project', projectSchema);
