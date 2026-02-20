# Setup Instructions

To run this project locally, you need to have Node.js installed. It appears that Node.js is currently not installed or not available in your system's PATH.

## 1. Install Node.js

1.  Visit the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
2.  Download the **LTS (Long Term Support)** version recommended for most users.
3.  Run the installer and follow the on-screen instructions.
    *   **Important:** Ensure that the option to **"Add to PATH"** is selected during installation.

## 2. Verify Installation

After installation, close your current terminal/VS Code and open a new one to refresh the environment variables. Then run these commands to verify:

```bash
node -v
npm -v
```

If these commands return version numbers, you are ready to proceed.

## 3. Run the Project

Once Node.js is installed, you can start the project with:

```bash
npm install
npm run dev
```

This will install the dependencies and start the local development server.
