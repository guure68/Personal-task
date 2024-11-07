 //this is the task controller
 
const formidable = require('formidable');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { readFile, writeFile } = require('../utils/fileHandler');

const TASKS_FILE = path.join( __dirname, '../data/tasks.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
(async () => {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR);
    }
})();

const getTasks = async (req, res) => {
    try {
        const tasks = await readFile(TASKS_FILE);
        const status = new URL(req.url, `http://${req.headers.host}`).searchParams.get('status');
        // creating constrctor
        const filteredTasks = status 
            ? tasks.filter(task => task.status === status)
            : tasks;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(filteredTasks));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};

const createTask = async (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = UPLOADS_DIR;
    form.keepExtensions = true;

    try {
        const [fields, files] = await form.parse(req);
        const tasks = await readFile(TASKS_FILE);
        
        const newTask = {
            id: uuidv4(),
            title: fields.title[0],
            description: fields.description[0],
            status: fields.status[0] || 'pending',
            createdAt: new Date().toISOString()
        };

        if (files.image) {
            const oldPath = files.image[0].filepath;
            const extension = path.extname(files.image[0].originalFilename);
            const newFileName = `${newTask.id}${extension}`;
            const newPath = path.join(UPLOADS_DIR, newFileName);
            
            await fs.rename(oldPath, newPath);
            newTask.imagePath = `/uploads/${newFileName}`;
        }

        tasks.push(newTask);
        await writeFile(TASKS_FILE, tasks);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTask));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};

const updateTask = async (req, res) => {
    const taskId = req.url.split('/')[2];
    const form = new formidable.IncomingForm();
    form.uploadDir = UPLOADS_DIR;
    form.keepExtensions = true;

    try {
        const [fields, files] = await form.parse(req);
        const tasks = await readFile(TASKS_FILE);
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Task not found' }));
            return;
        }

        const updatedTask = {
            ...tasks[taskIndex],
            title: fields.title?.[0] || tasks[taskIndex].title,
            description: fields.description?.[0] || tasks[taskIndex].description,
            status: fields.status?.[0] || tasks[taskIndex].status,
            updatedAt: new Date().toISOString()
        };

        if (files.image) {
            if (tasks[taskIndex].imagePath) {
                const oldImagePath = path.join(__dirname, '..', tasks[taskIndex].imagePath);
                try {
                    await fs.unlink(oldImagePath);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                }
            }

            const oldPath = files.image[0].filepath;
            const extension = path.extname(files.image[0].originalFilename);
            const newFileName = `${taskId}${extension}`;
            const newPath = path.join(UPLOADS_DIR, newFileName);
            
            await fs.rename(oldPath, newPath);
            updatedTask.imagePath = `/uploads/${newFileName}`;
        }

        tasks[taskIndex] = updatedTask;
        await writeFile(TASKS_FILE, tasks);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updatedTask));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};

const deleteTask = async (req, res) => {
    const taskId = req.url.split('/')[2];

    try {
        const tasks = await readFile(TASKS_FILE);
        const taskIndex = tasks.findIndex(task => task.id === taskId);

        if (taskIndex === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Task not found' }));
            return;
        }

        if (tasks[taskIndex].imagePath) {
            const imagePath = path.join(__dirname, '..', tasks[taskIndex].imagePath);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }

        tasks.splice(taskIndex, 1);
        await writeFile(TASKS_FILE, tasks);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Task deleted successfully' }));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
