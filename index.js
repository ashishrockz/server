require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const connection = require('./service/db');
const authentication = require('./routers/auth');
const project = require('./routers/project');
const sprint = require('./routers/sprint');
const issue = require('./routers/issue');
const verifyToken = require('./middleware/auth');

// Database connection
connection();

// Middlewares
const app = express();
app.use(cors()); // CORS middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('/auth', authentication);
app.use('/api/project', verifyToken, project);
app.use('/api/sprint', verifyToken, sprint);
app.use('/api/issue', verifyToken, issue);

const __dirname1 =path.resolve();
if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname1, "/client/build/")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "client", "bulid" , "index.html"));
  });
}else{
  app.get('/', (req, res) => {
    res.send('Welcome to the API');
  });
}

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).send('404: Not Found');
});

const port = process.env.PORT || 8080; // Default to port 8080 if not specified in .env
app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});
