require('dotenv').config();

const { Octokit } = require('@octokit/rest');
const { marked } = require('marked');
const ejs = require('ejs');
const fs = require('fs').promises;
const path = require('path');
const dayjs = require('dayjs');

// Initialize Octokit
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Get repository info from environment
let owner, repo;
if (process.env.GITHUB_REPOSITORY) {
    [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
} else {
    // These values should match your GitHub username and repository name
    owner = 'theoldmnk'; // Replace with your GitHub username
    repo = 'adi-blog';  // Replace with your repository name
    console.log('Using local configuration:', { owner, repo });
    // Set the environment variable for potential future use
    process.env.GITHUB_REPOSITORY = `${owner}/${repo}`;
}

// Validate that we have the required values
if (!owner || !repo) {
    console.error('❌ Error: GitHub repository information is missing.');
    console.error('Please set the GITHUB_REPOSITORY environment variable in your .env file');
    console.error('Example: GITHUB_REPOSITORY=yourusername/your-repo-name');
    process.exit(1);
}

async function getPublishedIssues() {
    console.log(`Fetching published issues from ${owner}/${repo}...`);
    const issues = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        labels: 'published'
    });

    return issues.data;
}

function formatDate(date) {
    return dayjs(date).format('MMMM D, YYYY');
}

async function generatePost(issue) {
    const content = marked(issue.body);
    const template = await fs.readFile(path.join(__dirname, '../templates/post.ejs'), 'utf-8');
    
    const html = ejs.render(template, {
        post: {
            title: issue.title,
            content,
            date: issue.created_at,
            labels: issue.labels,
            number: issue.number
        },
        formatDate
    });

    const postDir = path.join(__dirname, '../../dist/posts');
    await fs.mkdir(postDir, { recursive: true });
    await fs.writeFile(path.join(postDir, `${issue.number}.html`), html);
}

async function generateIndex(issues) {
    const template = await fs.readFile(path.join(__dirname, '../templates/index.ejs'), 'utf-8');
    
    const posts = issues.map(issue => ({
        title: issue.title,
        excerpt: issue.body.split('\n')[0], // First line as excerpt
        date: issue.created_at,
        labels: issue.labels,
        number: issue.number
    }));

    const html = ejs.render(template, {
        posts,
        formatDate
    });

    await fs.writeFile(path.join(__dirname, '../../dist/index.html'), html);
}

async function copyStaticFiles() {
    const publicDir = path.join(__dirname, '../../public');
    const distDir = path.join(__dirname, '../../dist');
    
    await fs.mkdir(distDir, { recursive: true });
    await fs.cp(publicDir, distDir, { recursive: true });
}

async function build() {
    try {
        console.log('🚀 Starting build process...');
        
        console.log('📦 Copying static files...');
        await copyStaticFiles();
        
        console.log('📥 Fetching published issues...');
        const issues = await getPublishedIssues();
        
        console.log(`📝 Generating ${issues.length} posts...`);
        await Promise.all(issues.map(generatePost));
        
        console.log('🏠 Generating index page...');
        await generateIndex(issues);
        
        console.log('✨ Build completed successfully!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

build(); 