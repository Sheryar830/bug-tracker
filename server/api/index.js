const serverless = require("serverless-http");
const app = require("../src/server"); // uses the exported app
module.exports = serverless(app);
