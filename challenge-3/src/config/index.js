const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');

module.exports = {
  port: process.env.PORT || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  paths: {
    views: path.join(ROOT_DIR, 'views'),
    public: path.join(ROOT_DIR, 'public'),
    data: path.join(ROOT_DIR, 'data'),
    govukDist: path.join(ROOT_DIR, 'node_modules', 'govuk-frontend', 'dist', 'govuk')
  }
};
