const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all tasks for user
router.get('/', (req, res) => {
  const { status, priority, sort = 'created_at', order = 'DESC' } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.user.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ` ORDER BY ${sort} ${order}`;

  db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    res.json(tasks);
  });
});

// Get single task
router.get('/:id', (req, res) => {
  db.get(
    'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch task' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    }
  );
});

// Create task
router.post('/', (req, res) => {
  const { title, description, priority = 'medium', due_date } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    'INSERT INTO tasks (title, description, priority, due_date, user_id) VALUES (?, ?, ?, ?, ?)',
    [title, description, priority, due_date, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create task' });
      }

      // Log analytics
      db.run(
        'INSERT INTO task_analytics (user_id, action, task_id) VALUES (?, ?, ?)',
        [req.user.id, 'created', this.lastID]
      );

      // Real-time notification
      req.io.to(`user_${req.user.id}`).emit('taskCreated', {
        id: this.lastID,
        title,
        message: `Task "${title}" created successfully`
      });

      res.status(201).json({
        id: this.lastID,
        title,
        description,
        priority,
        due_date,
        status: 'pending',
        user_id: req.user.id
      });
    }
  );
});

// Update task
router.put('/:id', (req, res) => {
  const { title, description, status, priority, due_date } = req.body;
  const updates = [];
  const params = [];

  if (title) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status) { updates.push('status = ?'); params.push(status); }
  if (priority) { updates.push('priority = ?'); params.push(priority); }
  if (due_date !== undefined) { updates.push('due_date = ?'); params.push(due_date); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id, req.user.id);

  db.run(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update task' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Log analytics
      db.run(
        'INSERT INTO task_analytics (user_id, action, task_id) VALUES (?, ?, ?)',
        [req.user.id, 'updated', req.params.id]
      );

      // Real-time notification
      req.io.to(`user_${req.user.id}`).emit('taskUpdated', {
        id: req.params.id,
        message: 'Task updated successfully'
      });

      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete task
router.delete('/:id', (req, res) => {
  db.run(
    'DELETE FROM tasks WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete task' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Log analytics
      db.run(
        'INSERT INTO task_analytics (user_id, action, task_id) VALUES (?, ?, ?)',
        [req.user.id, 'deleted', req.params.id]
      );

      // Real-time notification
      req.io.to(`user_${req.user.id}`).emit('taskDeleted', {
        id: req.params.id,
        message: 'Task deleted successfully'
      });

      res.json({ message: 'Task deleted successfully' });
    }
  );
});

module.exports = router;