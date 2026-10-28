const { existsSync } = require("node:fs");
const path = require("node:path");

const envPath = path.join(__dirname, "../.env");
if (existsSync(envPath)) process.loadEnvFile(envPath);
