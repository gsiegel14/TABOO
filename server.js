// Simple Express server for the Taboo game
// Serves files from the root directory

const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the ROOT directory (not from /public)
app.use(express.static(__dirname));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Taboo game server running at http://localhost:${port}`);
    console.log(`Serving files from: ${__dirname}`);
}); 