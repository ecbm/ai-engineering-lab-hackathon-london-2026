const express = require('express');
const router = express.Router();

const CASE_TYPE_LABELS = {
  benefit_review: 'Benefit review',
  licence_application: 'Licence application',
  compliance_check: 'Compliance check'
};

const TEAMS = ['team_a', 'team_b', 'team_c'];

function generateCaseId(cases) {
  const year = new Date().getFullYear();
  const max = cases.reduce((m, c) => {
    const n = parseInt(c.case_id.split('-')[2], 10);
    return n > m ? n : m;
  }, 0);
  return `CASE-${year}-${String(max + 1).padStart(5, '0')}`;
}

function generateReference() {
  return `REF-${Math.floor(10000 + Math.random() * 90000)}`;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// GET /submit — show form
router.get('/', (req, res) => {
  res.render('submit.njk', {
    title: 'Submit a case — CaseTracker',
    activePage: 'submit',
    errors: [],
    values: {}
  });
});

// POST /submit — validate and create case
router.post('/', (req, res) => {
  const { name, date_of_birth, case_type, description } = req.body;
  const errors = [];

  if (!name || !name.trim()) {
    errors.push({ field: 'name', text: 'Enter the applicant name' });
  }
  if (!case_type || !CASE_TYPE_LABELS[case_type]) {
    errors.push({ field: 'case_type', text: 'Select a case type' });
  }
  if (!description || !description.trim()) {
    errors.push({ field: 'description', text: 'Enter a description of the circumstances' });
  }

  if (errors.length > 0) {
    return res.status(400).render('submit.njk', {
      title: 'Submit a case — CaseTracker',
      activePage: 'submit',
      errors,
      values: { name, date_of_birth, case_type, description }
    });
  }

  const { cases } = req.app.locals;
  const caseId = generateCaseId(cases);
  const reference = generateReference();
  const assignedTo = TEAMS[Math.floor(Math.random() * TEAMS.length)];
  const createdDate = today();

  const newCase = {
    case_id: caseId,
    case_type,
    status: 'case_created',
    applicant: {
      name: name.trim(),
      reference,
      date_of_birth: date_of_birth || null
    },
    assigned_to: assignedTo,
    created_date: createdDate,
    last_updated: createdDate,
    timeline: [
      { date: createdDate, event: 'case_created', note: description.trim() }
    ],
    case_notes: description.trim()
  };

  cases.push(newCase);

  res.redirect(`/submit/confirmation/${caseId}`);
});

// GET /submit/confirmation/:id — confirmation page
router.get('/confirmation/:id', (req, res) => {
  const { cases } = req.app.locals;
  const caseObj = cases.find(c => c.case_id === req.params.id);

  if (!caseObj) {
    return res.status(404).render('404.njk', { title: 'Page not found — CaseTracker' });
  }

  res.render('submit-confirmation.njk', {
    title: 'Case submitted — CaseTracker',
    activePage: 'submit',
    case: caseObj,
    caseTypeLabel: CASE_TYPE_LABELS[caseObj.case_type] || caseObj.case_type
  });
});

module.exports = router;
