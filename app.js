const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Tells server to load anything in .env into an environment variable.
require('dotenv').config();

const feedRoutes = require('./routes/feed');

const MONGODB_URI =
  // process object is globally available in Node app; part of Node core runtime. The env property contains all environment variables known by process object. Using dotenv to store environment variables. It loads environment variables from .env file into process.env (see https://www.youtube.com/watch?v=17UVejOw3zA)
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-4yuid.mongodb.net/${process.env.MONGO_DATABASE_NAME}`;

const app = express();

// Middleware needed to parse incoming JSON data so can extract it on the request body (body parser adds body field on incoming request)
// app.use(bodyParser.urlencoded()); // For x-www-form-urlencoded, default format for data sent via form post request
app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, 'images')));

// Set CORS headers to bypass CORS error, a default security mechanism set by browsers that occurs when the server-side web API (the back end, which has the API endpoints, the path and method, and defines the logic that should execute on the server when a request reaches them) and client (front end) are on different servers/domains and try to exchange data
app.use((req, res, next) => {
  // Allow data/content to be accessed by specific origins/clients (all in this case)
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow these origins to use specific HTTP methods
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  // Headers clients can use on requests
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);

mongoose
  .connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
