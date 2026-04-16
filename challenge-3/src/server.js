const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`CaseTracker running at http://localhost:${config.port}`);
});
