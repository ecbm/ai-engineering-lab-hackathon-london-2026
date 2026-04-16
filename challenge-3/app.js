const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');

const app = express();

// Configure Nunjucks
const nunjucksEnv = nunjucks.configure(path.join(__dirname, 'views'), {
  autoescape: true,
  express: app,
  watch: process.env.NODE_ENV !== 'production'
});

app.set('view engine', 'njk');

// Nunjucks filters
nunjucksEnv.addFilter('formatDate', (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
});

nunjucksEnv.addFilter('caseTypeLabel', (caseType) => {
  const labels = {
    benefit_review: 'Benefit review',
    licence_application: 'Licence application',
    compliance_check: 'Compliance check'
  };
  return labels[caseType] || caseType;
});

nunjucksEnv.addFilter('statusLabel', (status) => {
  const labels = {
    case_created: 'Case created',
    awaiting_evidence: 'Awaiting evidence',
    under_review: 'Under review',
    pending_decision: 'Pending decision',
    escalated: 'Escalated',
    closed: 'Closed'
  };
  return labels[status] || status.replace(/_/g, ' ');
});

nunjucksEnv.addFilter('statusTagClass', (status) => {
  const classes = {
    awaiting_evidence: 'govuk-tag--orange',
    under_review: 'govuk-tag--blue',
    pending_decision: 'govuk-tag--purple',
    escalated: 'govuk-tag--red',
    closed: 'govuk-tag--grey',
    case_created: 'govuk-tag--blue'
  };
  return classes[status] || '';
});

nunjucksEnv.addFilter('eventLabel', (event) => {
  const labels = {
    case_created: 'Case created',
    evidence_requested: 'Evidence requested',
    evidence_received: 'Evidence received',
    evidence_verified: 'Evidence verified',
    under_review: 'Under review',
    inspection_completed: 'Inspection completed',
    site_visit: 'Site visit',
    consultation_opened: 'Consultation opened',
    pending_decision: 'Pending decision',
    escalated: 'Escalated',
    closed: 'Closed'
  };
  return labels[event] || event.replace(/_/g, ' ');
});

nunjucksEnv.addFilter('teamLabel', (team) => {
  if (!team) return '';
  return team.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
});

// Serve govuk-frontend assets
const govukDistPath = path.join(__dirname, 'node_modules/govuk-frontend/dist/govuk');
app.use('/assets', express.static(path.join(govukDistPath, 'assets')));
app.use('/govuk-frontend.min.css', express.static(path.join(govukDistPath, 'govuk-frontend.min.css')));
app.use('/govuk-frontend.bundle.js', express.static(path.join(govukDistPath, 'all.bundle.js')));

// Serve app-level static assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// Parse form data
app.use(express.urlencoded({ extended: false }));

// Load data at startup
const cases = require('./cases.json');
const policies = require('./policy-extracts.json');
const workflowStates = require('./workflow-states.json');
const aiSummaries = require('./data/ai-summaries.json');

app.locals.cases = cases;
app.locals.policies = policies;
app.locals.workflowStates = workflowStates;
app.locals.aiSummaries = aiSummaries;

// Routes
app.use('/api', require('./routes/api'));
app.use('/case', require('./routes/cases'));
app.use('/', require('./routes/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404.njk', { title: 'Page not found — CaseTracker' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CaseTracker running at http://localhost:${PORT}`);
});

module.exports = app;
