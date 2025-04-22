
const express = require('express');
const app = express();
const port = 5000;

// Serve static files from root directory
app.use(express.static('./'));

// Main route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
