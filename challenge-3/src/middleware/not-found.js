function notFound(req, res) {
  res.status(404).render('404.njk', { title: 'Page not found — CaseTracker' });
}

module.exports = notFound;
