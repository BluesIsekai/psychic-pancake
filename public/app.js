document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const taskList = document.getElementById('taskList');
    
    loadTasks();
    
    addTaskBtn.addEventListener('click', addTask);
    viewAllBtn.addEventListener('click', loadTasks);
    
    async function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        try {
            const response = await fetch('/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: taskText, completed: false })
            });
            
            if (response.ok) {
                taskInput.value = '';
                loadTasks();
            } else {
                console.error('Failed to add task');
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    }
    
    async function loadTasks() {
        try {
            const response = await fetch('/tasks');
            const tasks = await response.json();
            
            renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }
    
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTaskStatus(task.id, checkbox.checked));
            
            const taskText = document.createElement('span');
            taskText.className = 'task-text';
            taskText.textContent = task.text;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            taskItem.appendChild(checkbox);
            taskItem.appendChild(taskText);
            taskItem.appendChild(deleteBtn);
            taskList.appendChild(taskItem);
        });
    }
    
    async function toggleTaskStatus(taskId, completed) {
        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });
            
            if (response.ok) {
                loadTasks();
            } else {
                console.error('Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }
    
    async function deleteTask(taskId) {
        try {
            const response = await fetch(`/tasks/${taskId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                loadTasks();
            } else {
                console.error('Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
});