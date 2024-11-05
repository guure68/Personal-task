const http = require('http'); 
// this port
const PORT4 = 9000;
///sever
const HOSTNAME = 'localhost';

const server = http.createServer((req, res) => {
    if (req.url.startsWith("/tasks")) {
        taskRoutes(req, res);
    } else {
        res.writeHead(404, 'Not Found', { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Page not found' }));
    }
});
module.exports = taskRoutes;
