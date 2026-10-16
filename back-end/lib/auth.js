const jwt = require('jsonwebtoken');

function createRequireAuth(Employee, secret) {
  return async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required. Please log in.' });
    let user;
    try { user = jwt.verify(header.slice(7), secret); }
    catch (_) { return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' }); }
    try {
      
      // RE-CHECKING OF ACCESS ACCOUNT 
      const employee = await Employee.findById(user.sub).select('-portal_access.password');
      if (!employee || !employee.portal_access?.has_access || (user.auth_version || 0) !== (employee.auth_version || 0) || ['TERMINATED', 'INACTIVE'].includes(String(employee.employment_details?.status).toUpperCase())) return res.status(401).json({ error: 'This account no longer has portal access. Please sign in again.' });
      const dept = (employee.employment_details?.department || '').toLowerCase();
      req.user = { ...user, role: dept.includes('admin') ? 'admin' : 'employee', module: dept.includes('admin') ? 'admin' : dept.includes('housekeeping') ? 'housekeeping' : dept.includes('maintenance') ? 'maintenance' : 'frontdesk' };
      next();
    } catch (_) { return res.status(503).json({ error: 'Unable to verify account access. Try again later.' }); }
  };
}
module.exports = { createRequireAuth };
