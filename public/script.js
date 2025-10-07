class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        this.taskIdCounter = parseInt(localStorage.getItem('taskIdCounter') || '1');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTasks();
        this.loadAnalytics();
    }

    setupEventListeners() {
        // Task form
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTask();
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('taskIdCounter', this.taskIdCounter.toString());
    }

    createTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        const due_date = document.getElementById('task-due-date').value;

        if (!title.trim()) {
            this.showNotification('Task title is required', 'error');
            return;
        }

        const newTask = {
            id: this.taskIdCounter++,
            title: title.trim(),
            description: description.trim(),
            status: 'pending',
            priority,
            due_date: due_date || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this.tasks.push(newTask);
        this.saveTasks();
        this.loadTasks();
        this.loadAnalytics();
        document.getElementById('task-form').reset();
        this.showNotification('Task created successfully!');
    }

    loadTasks() {
        const status = document.getElementById('status-filter').value;
        const priority = document.getElementById('priority-filter').value;
        
        let filteredTasks = this.tasks;
        
        if (status) {
            filteredTasks = filteredTasks.filter(task => task.status === status);
        }
        
        if (priority) {
            filteredTasks = filteredTasks.filter(task => task.priority === priority);
        }
        
        // Sort by created_at descending
        filteredTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        this.renderTasks(filteredTasks);
    }

    renderTasks(tasks) {
        const container = document.getElementById('tasks-list');
        
        if (tasks.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #666;">No tasks found</div>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item">
                <div class="task-info">
                    <h3>${task.title}</h3>
                    <p>${task.description || 'No description'}</p>
                    <div class="task-meta">
                        <span class="status ${task.status}">${task.status.replace('_', ' ')}</span>
                        <span class="priority ${task.priority}">${task.priority}</span>
                        ${task.due_date ? `<span>Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    ${task.status !== 'completed' ? `<button class="btn-complete" onclick="taskManager.updateTaskStatus(${task.id}, 'completed')">Complete</button>` : ''}
                    ${task.status === 'pending' ? `<button class="btn-edit" onclick="taskManager.updateTaskStatus(${task.id}, 'in_progress')">Start</button>` : ''}
                    <button class="btn-delete" onclick="taskManager.deleteTask(${task.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateTaskStatus(taskId, status) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            task.updated_at = new Date().toISOString();
            this.saveTasks();
            this.loadTasks();
            this.loadAnalytics();
            this.showNotification('Task updated successfully!');
        }
    }

    deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.loadTasks();
        this.loadAnalytics();
        this.showNotification('Task deleted successfully!');
    }

    loadAnalytics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const overdue = this.tasks.filter(t => 
            t.due_date && 
            new Date(t.due_date) < new Date() && 
            t.status !== 'completed'
        ).length;

        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('overdue-tasks').textContent = overdue;
    }



    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

function loadTasks() {
    taskManager.loadTasks();
}

// Initialize the app
const taskManager = new TaskManager();