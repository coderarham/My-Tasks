const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Task statistics
router.get('/tasks/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total FROM tasks WHERE user_id = ?',
    'SELECT COUNT(*) as pending FROM tasks WHERE user_id = ? AND status = "pending"',
    'SELECT COUNT(*) as in_progress FROM tasks WHERE user_id = ? AND status = "in_progress"',
    'SELECT COUNT(*) as completed FROM tasks WHERE user_id = ? AND status = "completed"',
    'SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY priority',
    'SELECT DATE(created_at) as date, COUNT(*) as count FROM tasks WHERE user_id = ? AND created_at >= date("now", "-30 days") GROUP BY DATE(created_at) ORDER BY date'
  ];

  const results = {};
  let completed = 0;

  queries.forEach((query, index) => {
    db.all(query, [req.user.id], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch analytics' });
      }

      switch(index) {
        case 0: results.total = rows[0].total; break;
        case 1: results.pending = rows[0].pending; break;
        case 2: results.in_progress = rows[0].in_progress; break;
        case 3: results.completed = rows[0].completed; break;
        case 4: results.by_priority = rows; break;
        case 5: results.daily_creation = rows; break;
      }

      completed++;
      if (completed === queries.length) {
        res.json(results);
      }
    });
  });
});

// User activity analytics
router.get('/activity', (req, res) => {
  const { days = 7 } = req.query;
  
  db.all(
    `SELECT action, COUNT(*) as count, DATE(timestamp) as date 
     FROM task_analytics 
     WHERE user_id = ? AND timestamp >= date('now', '-${days} days')
     GROUP BY action, DATE(timestamp)
     ORDER BY date DESC`,
    [req.user.id],
    (err, activities) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch activity data' });
      }
      res.json(activities);
    }
  );
});

// Productivity metrics
router.get('/productivity', (req, res) => {
  const queries = [
    `SELECT 
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
       COUNT(*) as total_tasks,
       ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
     FROM tasks WHERE user_id = ?`,
    
    `SELECT 
       AVG(JULIANDAY(updated_at) - JULIANDAY(created_at)) as avg_completion_time
     FROM tasks 
     WHERE user_id = ? AND status = 'completed'`,
    
    `SELECT COUNT(*) as overdue_tasks
     FROM tasks 
     WHERE user_id = ? AND due_date < datetime('now') AND status != 'completed'`
  ];

  const results = {};
  let completed = 0;

  queries.forEach((query, index) => {
    db.get(query, [req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch productivity metrics' });
      }

      switch(index) {
        case 0: 
          results.completion_rate = row.completion_rate || 0;
          results.completed_tasks = row.completed_tasks;
          results.total_tasks = row.total_tasks;
          break;
        case 1: 
          results.avg_completion_time_days = row.avg_completion_time || 0;
          break;
        case 2: 
          results.overdue_tasks = row.overdue_tasks;
          break;
      }

      completed++;
      if (completed === queries.length) {
        res.json(results);
      }
    });
  });
});

module.exports = router;