# my blog

a minimalist blog powered by github issues.

## setup

1. clone this repository
2. copy `.env.example` to `.env` and fill in your GitHub token and repository information
3. create a "published" label in your GitHub repository
4. create issues with the "published" label to create blog posts
5. run `npm install` to install dependencies
6. run `npm run dev` to start the development server

## deployment

this blog is set up to deploy to github pages using github actions. the workflow will:

1. build the blog
2. deploy it to the gh-pages branch
3. github pages will serve the content from this branch

to set up github pages:

1. go to your repository settings
2. navigate to "pages"
3. select "deploy from a branch"
4. select the "gh-pages" branch and "/ (root)" folder
5. click "save"

## writing posts

to create a new blog post:

1. create a new issue in your github repository
2. the issue title will be the blog post title
3. write your blog post content in markdown in the issue body
4. add the "published" label to the issue

the blog will automatically update when you push changes or once a day via the scheduled github action. 