const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const config = require('./config');
const { registerFilters } = require('./filters/nunjucks');
const registerRoutes = require('./routes');
const notFound = require('./middleware/not-found');

const app = express();

// Template engine
const nunjucksEnv = nunjucks.configure(config.paths.views, {
  autoescape: true,
  express: app,
  watch: !config.isProduction
});
app.set('view engine', 'njk');
registerFilters(nunjucksEnv);

// Static assets
app.use('/assets', express.static(path.join(config.paths.govukDist, 'assets')));
app.use('/govuk-frontend.min.css', express.static(path.join(config.paths.govukDist, 'govuk-frontend.min.css')));
app.use('/govuk-frontend.bundle.js', express.static(path.join(config.paths.govukDist, 'all.bundle.js')));
app.use('/public', express.static(config.paths.public));

// Parse form data
app.use(express.urlencoded({ extended: false }));

// Load data
app.locals.cases = require(path.join(config.paths.data, 'cases.json'));
app.locals.policies = require(path.join(config.paths.data, 'policy-extracts.json'));
app.locals.workflowStates = require(path.join(config.paths.data, 'workflow-states.json'));
app.locals.aiSummaries = require(path.join(config.paths.data, 'ai-summaries.json'));

// Routes
registerRoutes(app);

// 404
app.use(notFound);

module.exports = app;
