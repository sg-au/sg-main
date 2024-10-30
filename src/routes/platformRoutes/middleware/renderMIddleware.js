// src/routes/platformRoutes/middleware/renderMiddleware.js
const path = require("path");

module.exports = (controllerName) => {
  return (req, res, next) => {
    /**
     * Renders a page with the controller-specific prefix.
     * @param {string} page - The name of the page to render.
     * @param {object} [options] - Additional options to pass to res.render.
     */
    res.renderPage = (page, options = {}) => {
      const viewPath = path.join("platform", "pages", controllerName, page);
      res.render(viewPath, options);
    };
    next();
  };
};
