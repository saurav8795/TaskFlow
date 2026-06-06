const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, projectMember, projectAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to format task response
const formatTask = (task, project = null) => ({
  id: task._id,
  projectId: task.project._id || task.project,
  projectName: project?.name || task.project?.name || null,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  assigneeId: task.assignee?._id || task.assignee || null,
  assigneeName: task.assignee?.name || null,
  dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : null,
  createdBy: task.createdBy,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

// @route   GET /api/tasks/my
// @desc    Get all tasks assigned to current user
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user._id })
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .sort({ dueDate: 1, priority: -1 });

    res.json(tasks.map(t => formatTask(t)));
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/project/:projectId
// @desc    Get all tasks in a project
// @access  Private (Member)
router.get('/project/:projectId', protect, projectMember, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks.map(t => formatTask(t, req.project)));
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics for current user
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Get all projects user is a member of
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);

    // Get all tasks in those projects
    const allTasks = await Task.find({ project: { $in: projectIds } });
    
    // Get tasks assigned to user
    const myTasks = await Task.find({ assignee: req.user._id });

    const now = new Date();
    const overdueTasks = myTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    );

    res.json({
      total: myTasks.length,
      todo: myTasks.filter(t => t.status === 'todo').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      review: myTasks.filter(t => t.status === 'review').length,
      done: myTasks.filter(t => t.status === 'done').length,
      overdue: overdueTasks.length,
      highPriority: myTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
      allProjectTasks: allTasks.length
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private (Member of project)
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name members')
      .populate('assignee', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is member of the project
    const project = await Project.findById(task.project._id);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(formatTask(task));
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tasks
// @desc    Create a task
// @access  Private (Member of project)
router.post('/', protect, [
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { projectId, title, description, priority, status, assigneeId, dueDate } = req.body;

    // Check if user is member of project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    // Validate assignee is a member (if provided)
    if (assigneeId && !project.isMember(assigneeId)) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    const task = await Task.create({
      project: projectId,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'todo',
      assignee: assigneeId || null,
      dueDate: dueDate || null,
      createdBy: req.user._id
    });

    await task.populate('assignee', 'name email');

    res.status(201).json(formatTask(task, project));
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private (Member of project)
router.put('/:id', protect, [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is member of project
    const project = await Project.findById(task.project);
    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    const { title, description, priority, status, assigneeId, dueDate } = req.body;

    // Validate assignee is a member (if provided)
    if (assigneeId && !project.isMember(assigneeId)) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('assignee', 'name email');

    res.json(formatTask(task, project));
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private (Admin of project)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is admin of project
    const project = await Project.findById(task.project);
    if (!project.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
