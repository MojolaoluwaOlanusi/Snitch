## CONTRIBUTING TO SNITCH

I appreciate your interest in contributing to Snitch! 🎉 This document outlines the guidelines and processes for contributing to the project. Whether you're reporting a bug, suggesting a feature, or submitting code, we appreciate your help in making Snitch better.

## 📜 CODE OF CONDUCT

By participating in this project, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing. We are committed to providing a harassment-free experience for everyone.

**🤝 How Can I Contribute?**

🐛 Reporting Bugs

Before creating a bug report, please check if the issue already exists in the [Issues tab]([https://github.com/MojolaoluwaOlanusi/Snitch/issues](https://github.com/MojolaoluwaOlanusi/Snitch/issues)).

If you find a new bug, create a new issue with the following information:

**Clear title** – Summarize the issue.
**Steps to reproduce** – Provide step‑by‑step instructions.
**Expected behavior** – What you expected to happen.
**Actual behavior** – What actually happened.
**Screenshots or logs** – If applicable, add screenshots or error logs.
**Environment** – OS, browser, Node.js version, etc.

**Example:**

### Bug: Cannot send message in chat

**Steps to reproduce:**
1. Log in to the app.
2. Open a conversation.
3. Type a message and press Enter.

**Expected:** The message is sent and appears in the chat.
**Actual:** The message disappears and no error is shown.

**Environment:**
- OS: macOS 14.5
- Browser: Chrome 126
- Node.js: v20.11.0
💡 Suggesting Features
## We welcome feature suggestions! Please create an issue with:

Clear title – What you want to add.

Description – Explain the feature in detail.

Why it's valuable – How it benefits users or the project.

Mockups or examples – If you have a design idea, share it.

🚀 Development Setup

Prerequisites

Node.js v20.x or higher

npm v10.x or higher

Git

MongoDB (local or Atlas)

Redis (local or Redis Cloud)

Cloning the Repository
<pre>
git clone [https://github.com/MojolaoluwaOlanusi/Snitch.git](https://github.com/MojolaoluwaOlanusi/Snitch.git)
cd Snitch
</pre>
Backend Setup
<pre>
cd backend
npm install
</pre>
## Create a .env file in the backend/ folder:
## .ENV
<pre>
## PORT=4500
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/snitch
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
CLIENT_URL=[http://localhost:5173](http://localhost:5173)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
</pre>

## Run the backend development server:

<pre>
npm run dev
</pre>
Frontend Setup
<pre>
cd frontend
npm install
</pre>
## Create a .env.local file in the frontend/ folder:

## ENV
<pre>
VITE_API_URL=[http://localhost:4500/api](http://localhost:4500/api)
</pre>
## Run the frontend development server:

<pre>
npm run dev
</pre>
The app will be available at [http://localhost:5173.](http://localhost:5173.)

Admin Panel Setup
<pre>
cd admin
npm install
</pre>
## Create a .env.local file in the admin/ folder:

## ENV
<pre>
VITE_API_URL=[http://localhost:4500/api](http://localhost:4500/api)
</pre>
## Run the admin panel:

<pre>
npm run dev
</pre>
📝 Code Style Guidelines
Backend (TypeScript + Node.js)
Use TypeScript – strict typing is encouraged.

Follow ESLint rules: npm run lint.

Use async/await for asynchronous code.

Write meaningful variable and function names.

Add JSDoc comments for complex functions.

## Example:

typescript
/**
- Fetch a user by their ID.
- @param userId – The user's MongoDB ObjectId.
- @returns The user document or null.
*/
async function getUserById(userId: string): Promise<UserDocument | null> {
return User.findById(userId);
}
Frontend (React + TailwindCSS)
Use functional components with hooks.

Keep components small and focused.

Use TailwindCSS for styling – avoid custom CSS when possible.

## Follow the existing folder structure:

```plaintext
src/
├── components/       # Reusable components
├── pages/            # Page-level components
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
├── utils/            # Helper functions
└── lib/              # API clients
```
Commit Message Format
## We follow Conventional Commits:

```plaintext
## Types:

Type	Description
feat	New feature
fix	    Bug fix
docs	Documentation changes
style	Code style (formatting, etc.)
refactor	Code refactoring
perf	Performance improvements
test	Adding/fixing tests
chore	Maintenance tasks (dependencies, configs)
ci	CI/CD changes
```
Scope: The part of the codebase affected (e.g., chat, auth, posts, api).

Subject: A short, imperative description of the change (max 50 characters).

## Examples:

```plaintext
feat(chat): add typing indicators
fix(auth): prevent login crash on missing email
docs(readme): update deployment instructions
```
🔧 Pull Request Process
Step 1: Fork the Repository
Click the Fork button on the GitHub repository page to create your own copy.

Step 2: Create a Branch
## Create a branch with a descriptive name:

<pre>
git checkout -b feat/add-typing-indicators
</pre>
# or
<pre>
git checkout -b fix/login-error-handling
</pre>
Step 3: Make Your Changes
Write clean, well‑documented code.

Test your changes thoroughly.

## Run linting and formatting:

<pre>
npm run lint
npm run format
</pre>
Step 4: Commit Your Changes
Write a commit message following the Conventional Commits format:

<pre>
git commit -m "feat(chat): add real-time typing indicators"
</pre>
Step 5: Push to Your Fork
<pre>
git push origin feat/add-typing-indicators
</pre>
Step 6: Open a Pull Request
Go to the original repository on GitHub.

Click the "Pull requests" tab.

Click "New pull request".

Select your branch from the "Compare" dropdown.

## Fill out the pull request template:

Title: Brief description of the change.

Description: What you changed and why.

Screenshots: If applicable.

Checklist: Confirm you've tested and followed the guidelines.

Step 7: Code Review
A maintainer will review your pull request. Be open to feedback and make any requested changes.

✅ PR Checklist
## Before submitting a pull request, ensure:

□ Code follows the style guidelines.
□ All tests pass.
□ No linting errors.
□ Commit messages follow Conventional Commits.
□ Changes are well‑described in the PR.
□ Linked to a relevant issue (if applicable).
🧪 Testing
Backend Tests
<pre>
cd backend
npm test
</pre>
Frontend Tests
<pre>
cd frontend
npm test
</pre>
Manual Testing
Test your changes in both desktop and mobile views. The app should work on all screen sizes.

🐛 Issues and Discussions
Bug reports: Use the Issues tab.

Feature requests: Open an issue with the enhancement label.

Questions or ideas: Start a GitHub Discussion.

🛡️ Security
If you discover a security vulnerability, please do not open a public issue. Instead, please contact the maintainers directly at olanusimojola@gmail.com.

We take security seriously and will respond promptly.

📚 Resources
Project README

Code of Conduct

GitHub Docs: Contributing to Open Source

❤️ Thank You!
Every contribution – big or small – makes Snitch better. Whether you fix a typo, report a bug, or add a major feature, we appreciate your time and effort. Thank you for helping build Snitch! 🚀

---

## 📋 License

By contributing to Snitch, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE) file in the root of this repository.

---

## ❤️ Thank You!

Every contribution – big or small – makes Snitch better...
