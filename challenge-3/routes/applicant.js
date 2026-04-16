const express = require('express');
const router = express.Router();
const { augmentCase } = require('../lib/cases');
const { getWorkflowSteps } = require('../lib/workflow');
const { getEvidenceItems } = require('../lib/cases');

router.get('/', (req, res) => {
  res.render('applicant.njk', {
    title: 'Check your case status — CaseTracker',
    activePage: 'applicant',
    lookedUp: false
  });
});

router.post('/', (req, res) => {
  const { reference, dob } = req.body;
  const { cases, workflowStates } = req.app.locals;

  const errors = {};
  if (!reference || !reference.trim()) errors.reference = 'Enter your case reference number';
  if (!dob || !dob.trim()) errors.dob = 'Enter your date of birth';

  if (Object.keys(errors).length > 0) {
    return res.render('applicant.njk', {
      title: 'Error: Check your case status — CaseTracker',
      activePage: 'applicant',
      lookedUp: false,
      errors,
      values: { reference, dob }
    });
  }

  // Find case by applicant reference
  const refTrimmed = reference.trim().toUpperCase();
  const foundCase = cases.find(c =>
    c.applicant.reference.toUpperCase() === refTrimmed ||
    c.case_id.toUpperCase() === refTrimmed
  );

  if (!foundCase) {
    return res.render('applicant.njk', {
      title: 'Check your case status — CaseTracker',
      activePage: 'applicant',
      lookedUp: true,
      notFound: true,
      values: { reference, dob }
    });
  }

  const augmented = augmentCase(foundCase, workflowStates);
  const workflowSteps = getWorkflowSteps(augmented, workflowStates);
  const evidenceItems = getEvidenceItems(augmented, workflowStates);
  const timeline = [...augmented.timeline].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Applicant-friendly status message
  const STATUS_MESSAGES = {
    case_created: { heading: 'Your case has been received', body: 'We are reviewing your application.' },
    awaiting_evidence: { heading: 'Your case is in progress', body: 'We are waiting for documents from you.' },
    under_review: { heading: 'Your case is being reviewed', body: 'We have all the documents we need and are reviewing your case.' },
    pending_decision: { heading: 'A decision is being prepared', body: 'Your case has been reviewed and a decision is being prepared.' },
    escalated: { heading: 'Your case is in progress', body: 'Your case has been referred to a senior officer.' },
    closed: { heading: 'Your case is closed', body: 'A decision has been made and you have been notified.' }
  };

  const statusMessage = STATUS_MESSAGES[augmented.status] || STATUS_MESSAGES.case_created;

  res.render('applicant.njk', {
    title: 'Case status — CaseTracker',
    activePage: 'applicant',
    lookedUp: true,
    notFound: false,
    case: augmented,
    workflowSteps,
    evidenceItems,
    timeline,
    statusMessage
  });
});

module.exports = router;
