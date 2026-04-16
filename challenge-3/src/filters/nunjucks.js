/**
 * Register all custom Nunjucks filters
 * @param {object} env - Nunjucks environment
 */
function registerFilters(env) {
  env.addFilter('formatDate', (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  });

  env.addFilter('caseTypeLabel', (caseType) => {
    const labels = {
      benefit_review: 'Benefit review',
      licence_application: 'Licence application',
      compliance_check: 'Compliance check'
    };
    return labels[caseType] || caseType;
  });

  env.addFilter('statusLabel', (status) => {
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

  env.addFilter('statusTagClass', (status) => {
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

  env.addFilter('eventLabel', (event) => {
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

  env.addFilter('teamLabel', (team) => {
    if (!team) return '';
    return team.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  });
}

module.exports = { registerFilters };
