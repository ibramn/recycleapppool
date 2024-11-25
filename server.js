const express = require('express');
const { exec } = require('child_process');
const util = require('util');

const app = express();
const port = process.env.PORT || 3000;

// Convert exec to promise-based
const execPromise = util.promisify(exec);

// Function to execute PowerShell commands
async function executePowerShellCommand(command) {
    try {
        const { stdout, stderr } = await execPromise(`powershell -Command "${command}"`);
        if (stderr) {
            throw new Error(stderr);
        }
        return stdout;
    } catch (error) {
        throw error;
    }
}

// API endpoint to recycle app pool
app.post('/api/recycle-pool', async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        const appPoolName = 'api-dev-new.glamera.com'; // Your app pool name

        console.log(`Starting app pool recycling at ${timestamp}`);

        // Stop the app pool and wait until it's stopped
        const stopCommand = `Import-Module WebAdministration; 
            Stop-WebAppPool -Name '${appPoolName}'; 
            while((Get-WebAppPoolState -Name '${appPoolName}').Value -ne 'Stopped') { 
                Start-Sleep -Seconds 1 
            }`;
        
        console.log('Stopping app pool...');
        await executePowerShellCommand(stopCommand);
        console.log('App pool stopped successfully');

        // Start the app pool and wait until it's started
        const startCommand = `Start-WebAppPool -Name '${appPoolName}'; 
            while((Get-WebAppPoolState -Name '${appPoolName}').Value -ne 'Started') { 
                Start-Sleep -Seconds 1 
            }`;

        console.log('Starting app pool...');
        await executePowerShellCommand(startCommand);
        console.log('App pool started successfully');

        res.json({ 
            success: true, 
            message: 'Application pool recycled successfully',
            timestamp: new Date().toISOString()
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

// Serve static files
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});