const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect, projectMember, projectAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/projects
// @desc    Get all projects for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    // Add task stats to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasks = await Task.find({ project: project._id });
        const taskCount = tasks.length;
        const doneCount = tasks.filter(t => t.status === 'done').length;
        const userRole = project.getUserRole(req.user._id);

        return {
          id: project._id,
          name: project.name,
          description: project.description,
          createdBy: project.createdBy,
          members: project.members.map(m => ({
            userId: m.user._id,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            joinedAt: m.joinedAt
          })),
          taskCount,
          doneCount,
          progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0,
          role: userRole,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
      })
    );

    res.json(projectsWithStats);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private (Member)
router.get('/:id', protect, projectMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await Task.find({ project: project._id });
    const taskCount = tasks.length;
    const doneCount = tasks.filter(t => t.status === 'done').length;

    res.json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      members: project.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      taskCount,
      doneCount,
      progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0,
      role: req.userRole,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create a project
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Project name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    await project.populate('members.user', 'name email');
    await project.populate('createdBy', 'name email');

    res.status(201).json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      members: project.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      taskCount: 0,
      doneCount: 0,
      progress: 0,
      role: 'admin',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private (Admin)
router.put('/:id', protect, projectAdmin, [
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('members.user', 'name email').populate('createdBy', 'name email');

    res.json({
      id: project._id,
      name: project.name,
      description: project.description,
      createdBy: project.createdBy,
      members: project.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      role: 'admin',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private (Admin)
router.delete('/:id', protect, projectAdmin, async (req, res) => {
  try {
    // Delete all tasks in project
    await Task.deleteMany({ project: req.params.id });
    
    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects/:id/members
// @desc    Add a member to project
// @access  Private (Admin)
router.post('/:id/members', protect, projectAdmin, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, role } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found. They need to sign up first.' });
    }

    const project = req.project;

    // Check if already a member
    if (project.isMember(user._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add member
    project.members.push({
      user: user._id,
      role,
      joinedAt: new Date()
    });

    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      members: project.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id/members/:userId
// @desc    Update member role
// @access  Private (Admin)
router.put('/:id/members/:userId', protect, projectAdmin, [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { role } = req.body;
    const project = req.project;

    // Find member
    const memberIndex = project.members.findIndex(
      m => m.user.toString() === req.params.userId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Cannot change project creator's role
    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot change project creator\'s role' });
    }

    project.members[memberIndex].role = role;
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      members: project.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id/members/:userId
// @desc    Remove a member from project
// @access  Private (Admin)
router.delete('/:id/members/:userId', protect, projectAdmin, async (req, res) => {
  try {
    const project = req.project;

    // Cannot remove project creator
    if (project.createdBy.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove project creator' });
    }

    // Remove member
    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    await project.save();
    await project.populate('members.user', 'name email');

    res.json({
      members: project.members.map(m => ({
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        joinedAt: m.joinedAt
      }))
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
