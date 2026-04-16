const express = require('express');
const router = express.Router();
const { augmentCase, getEvidenceItems } = require('../lib/cases');
const { getPoliciesForCaseType } = require('../lib/policies');
const { getWorkflowSteps, getRequiredActions, getCurrentStateDef } = require('../lib/workflow');

function today() {
  return new Date().toISOString().split('T')[0];
}

const CASE_TYPE_LABELS = {
  benefit_review: 'Benefit review',
  licence_application: 'Licence application',
  compliance_check: 'Compliance check'
};

router.get('/:id', (req, res) => {
  const { cases, policies, workflowStates, aiSummaries } = req.app.locals;
  const caseObj = cases.find(c => c.case_id === req.params.id);

  if (!caseObj) {
    return res.status(404).render('404.njk', {
      title: 'Case not found — CaseTracker'
    });
  }

  const augmented = augmentCase(caseObj, workflowStates);
  const applicablePolicies = getPoliciesForCaseType(caseObj.case_type, policies);
  const workflowSteps = getWorkflowSteps(caseObj, workflowStates);
  const requiredActions = getRequiredActions(caseObj, workflowStates);
  const evidenceItems = getEvidenceItems(caseObj, workflowStates);
  const aiSummary = aiSummaries[caseObj.case_id] || null;
  const currentStateDef = getCurrentStateDef(caseObj, workflowStates);
  const allowedTransitions = currentStateDef ? currentStateDef.allowed_transitions : [];

  // Timeline in reverse chronological order
  const timeline = [...caseObj.timeline].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Back link: use referrer if available and it's from our app, else dashboard
  const referrer = req.get('Referer') || '/';
  const backLink = referrer.includes('/case/') ? '/' : referrer;

  res.render('case-detail.njk', {
    title: `${caseObj.applicant.name} — CaseTracker`,
    case: augmented,
    applicablePolicies,
    workflowSteps,
    requiredActions,
    evidenceItems,
    timeline,
    aiSummary,
    allowedTransitions,
    caseTypeLabel: CASE_TYPE_LABELS[caseObj.case_type] || caseObj.case_type,
    backLink
  });
});

// POST /case/:id/progress — advance to next workflow state
router.post('/:id/progress', (req, res) => {
  const { cases, workflowStates } = req.app.locals;
  const caseObj = cases.find(c => c.case_id === req.params.id);
  if (!caseObj) return res.status(404).render('404.njk', { title: 'Case not found — CaseTracker' });

  const stateDef = getCurrentStateDef(caseObj, workflowStates);
  if (!stateDef || stateDef.allowed_transitions.length === 0) {
    return res.redirect(`/case/${caseObj.case_id}`);
  }

  const nextState = req.body.next_state && stateDef.allowed_transitions.includes(req.body.next_state)
    ? req.body.next_state
    : stateDef.allowed_transitions[0];

  caseObj.status = nextState;
  caseObj.last_updated = today();
  caseObj.timeline.push({ date: today(), event: nextState, note: `Status progressed to ${nextState.replace(/_/g, ' ')}.` });

  res.redirect(`/case/${caseObj.case_id}`);
});

// POST /case/:id/escalate — escalate to team leader
router.post('/:id/escalate', (req, res) => {
  const { cases } = req.app.locals;
  const caseObj = cases.find(c => c.case_id === req.params.id);
  if (!caseObj) return res.status(404).render('404.njk', { title: 'Case not found — CaseTracker' });

  caseObj.status = 'escalated';
  caseObj.last_updated = today();
  caseObj.timeline.push({ date: today(), event: 'escalated', note: 'Escalated to team leader by caseworker.' });

  res.redirect(`/case/${caseObj.case_id}`);
});

// POST /case/:id/note — add a case note
router.post('/:id/note', (req, res) => {
  const { cases } = req.app.locals;
  const caseObj = cases.find(c => c.case_id === req.params.id);
  if (!caseObj) return res.status(404).render('404.njk', { title: 'Case not found — CaseTracker' });

  const note = (req.body.note || '').trim();
  if (note) {
    const datePrefix = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    caseObj.case_notes = `[${datePrefix}] ${note}\n\n${caseObj.case_notes}`;
    caseObj.last_updated = today();
    caseObj.timeline.push({ date: today(), event: 'note_added', note });
  }

  res.redirect(`/case/${caseObj.case_id}`);
});

module.exports = router;
