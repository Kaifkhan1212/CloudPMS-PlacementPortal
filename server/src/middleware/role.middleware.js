/**
 * middleware/role.middleware.js — Role-Based Access Control (RBAC) Middleware
 *
 * Must be used AFTER verifyToken (req.user must already be set).
 *
 * Usage:
 *   router.get('/admin/users', verifyToken, allowRoles('admin'), controller);
 *   router.post('/drives', verifyToken, allowRoles('placement_cell', 'admin'), controller);
 *
 * Design (for viva):
 *  - allowRoles() is a factory function — it returns a middleware configured
 *    with the specific roles allowed for that route.
 *  - RBAC at middleware layer means controllers stay clean — they assume
 *    the caller is already authorised.
 *  - 403 Forbidden vs 401 Unauthorized distinction:
 *      401 → "I don't know who you are" (no/invalid token)
 *      403 → "I know who you are, but you can't do this" (wrong role)
 */

'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware factory.
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware
 *
 * @example
 * router.delete('/users/:id', verifyToken, allowRoles('admin'), deleteUser);
 */
const allowRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      // This should never happen if allowRoles is used after verifyToken
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Required role(s): [${roles.join(', ')}]. Your role: [${req.user.role}]`
        )
      );
    }

    next();
  };
};

module.exports = { allowRoles };
