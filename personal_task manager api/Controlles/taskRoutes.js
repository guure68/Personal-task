const { getTasks, createTask, updateTask, deleteTask } = require('./controllers/taskController');

const handleRoutes = (req, res) => {
    const urlParts = req.url.split('/');
    const id = urlParts[2];

    if (req.url.startsWith('/tasks') && req.method === 'GET') {
        getTasks(req, res);
    } else if (req.url === '/tasks' && req.method === 'POST') {
        createTask(req, res);
    } else if (req.url.startsWith('/tasks') && req.method === 'PUT') {
        updateTask(req, res, id);
    } else if (req.url.startsWith('/tasks') && req.method === 'DELETE') {
        deleteTask(req, res, id);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
};

module.exports = { handleRoutes };
