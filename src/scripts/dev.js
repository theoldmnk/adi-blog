const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { watch } = require('fs');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../../dist');
const TEMPLATES_DIR = path.join(__dirname, '../templates');

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Run the build script
function runBuild() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Running build...');
        exec('node src/scripts/build.js', (error, stdout, stderr) => {
            if (error) {
                console.error('Build error:', error);
                reject(error);
                return;
            }
            console.log(stdout);
            if (stderr) console.error(stderr);
            console.log('✅ Build completed');
            resolve();
        });
    });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    try {
        // Remove query parameters and decode URI
        const url = decodeURIComponent(req.url.split('?')[0]);
        
        // Determine the file path
        let filePath = path.join(DIST_DIR, url === '/' ? 'index.html' : url);
        
        // Check if the file exists
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
        } catch (error) {
            // If file doesn't exist, try adding .html extension
            if (!path.extname(filePath)) {
                filePath += '.html';
            }
        }

        // Read the file
        const content = await fs.readFile(filePath);
        
        // Set content type header
        const ext = path.extname(filePath).toLowerCase();
        res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
        
        // Send the response
        res.writeHead(200);
        res.end(content);
    } catch (error) {
        // Handle 404 errors
        if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        // Handle other errors
        console.error('Server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

// Watch for file changes
function watchFiles() {
    console.log('👀 Watching for file changes...');
    
    // Watch template directory
    watch(TEMPLATES_DIR, { recursive: true }, async (eventType, filename) => {
        if (filename) {
            console.log(`🔄 File changed: ${filename}`);
            try {
                await runBuild();
                console.log('🔄 Rebuild complete, refresh your browser to see changes');
            } catch (error) {
                console.error('Error rebuilding after file change:', error);
            }
        }
    });
}

async function startServer() {
    try {
        // Run initial build
        await runBuild();
        
        // Start watching files
        watchFiles();
        
        // Start the server
        server.listen(PORT, () => {
            console.log(`🌍 Development server running at http://localhost:${PORT}`);
            console.log('📝 Edit your posts in GitHub Issues');
            console.log('🔄 Template changes will trigger automatic rebuilds');
            console.log('🔄 Refresh your browser to see the changes');
        });
    } catch (error) {
        console.error('Failed to start development server:', error);
        process.exit(1);
    }
}

startServer(); 