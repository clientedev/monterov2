const path = require('path');
const fs = require('fs');
const migrationsPath = path.resolve(__dirname, 'migrations');
const migrationsPathUp = path.resolve(__dirname, '..', 'migrations');
console.log('__dirname:', __dirname);
console.log('Path (server/migrations):', migrationsPath, fs.existsSync(migrationsPath));
console.log('Path (root/migrations):', migrationsPathUp, fs.existsSync(migrationsPathUp));
