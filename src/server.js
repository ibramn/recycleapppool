const express = require('express');
const path = require('path');
const iis = require('node-iis');
const util = require('util');

const app = express();

// Use process.env.PORT for IIS integration
const port = process.env.PORT || 3000;

// Explicitly set the Buffer encoding
Buffer.from('', 'utf8');

// Middleware to handle IIS-specific headers
app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'Node.js');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to recycle app pool
app.post('/api/recycle-pool', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        console.log(`Attempting to recycle app pool at ${timestamp}`);

        // Replace 'YourAppPoolName' with your actual app pool name
        await iis.recycleAppPool('YourAppPoolName');
        
        console.log(`Successfully recycled app pool at ${timestamp}`);
        
        res.json({ 
            success: true, 
            message: 'Application pool recycled successfully',
            timestamp
        });
    } catch (error) {
        console.error('Error recycling app pool:', {
            error: util.inspect(error, { depth: null }),
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to recycle application pool',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error'
    });
});

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
});