const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'Public')));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_mysql_password'
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    connection.query('CREATE DATABASE IF NOT EXISTS task_manager', err => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log('Database task_manager created or already exists');
        
        connection.query('USE task_manager', err => {
            if (err) {
                console.error('Error using database:', err);
                return;
            }
            
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS tasks (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    text VARCHAR(255) NOT NULL,
                    completed BOOLEAN DEFAULT false
                )
            `;
            
            connection.query(createTableQuery, err => {
                if (err) {
                    console.error('Error creating tasks table:', err);
                } else {
                    console.log('Tasks table created or already exists');
                }
            });
        });
    });
});

app.get('/tasks', (req, res) => {
    connection.query('SELECT * FROM tasks ORDER BY id DESC', (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).json({ error: 'Failed to fetch tasks' });
        }
        res.json(results);
    });
});

app.post('/tasks', (req, res) => {
    const { text, completed } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Task text is required' });
    }
    
    const query = 'INSERT INTO tasks (text, completed) VALUES (?, ?)';
    connection.query(query, [text, completed || false], (err, result) => {
        if (err) {
            console.error('Error adding task:', err);
            return res.status(500).json({ error: 'Failed to add task' });
        }
        
        res.status(201).json({ 
            id: result.insertId,
            text,
            completed: completed || false
        });
    });
});

app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { completed } = req.body;
    
    if (completed === undefined) {
        return res.status(400).json({ error: 'Completed status is required' });
    }
    
    const query = 'UPDATE tasks SET completed = ? WHERE id = ?';
    connection.query(query, [completed, taskId], (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Failed to update task' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ id: taskId, completed });
    });
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    
    const query = 'DELETE FROM tasks WHERE id = ?';
    connection.query(query, [taskId], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).json({ error: 'Failed to delete task' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ message: 'Task deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});