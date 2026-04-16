/**
 * Get all policies applicable to a given case type
 * @param {string} caseType - e.g. 'benefit_review'
 * @param {Array} allPolicies
 * @returns {Array}
 */
function getPoliciesForCaseType(caseType, allPolicies) {
  return allPolicies.filter(p => p.applicable_case_types.includes(caseType));
}

module.exports = { getPoliciesForCaseType };
