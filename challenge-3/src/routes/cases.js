const express = require('express');
const router = express.Router();
const { augmentCase, getEvidenceItems } = require('../lib/cases');
const { getPoliciesForCaseType } = require('../lib/policies');
const { getWorkflowSteps, getRequiredActions } = require('../lib/workflow');

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
    caseTypeLabel: CASE_TYPE_LABELS[caseObj.case_type] || caseObj.case_type,
    backLink
  });
});

module.exports = router;
