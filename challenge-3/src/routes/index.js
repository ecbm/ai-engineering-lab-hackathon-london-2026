function registerRoutes(app) {
  app.use('/api', require('./api'));
  app.use('/case', require('./cases'));
  app.use('/team', require('./team'));
  app.use('/applicant', require('./applicant'));
  app.use('/', require('./dashboard'));
}

module.exports = registerRoutes;
