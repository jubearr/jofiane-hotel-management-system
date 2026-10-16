const express = require('express');
const bcrypt = require('bcryptjs');
const service = require('./service');

function archiveError(res, error) {
  const transactionUnavailable = /Transaction numbers|replica set|mongos/i.test(error.message);
  const status = error.status || (error.code === 11000 ? 409 : transactionUnavailable ? 503 : 500);
  return res.status(status).json({ error: error.status ? error.message : status === 409 ? 'A conflicting record already exists.' : status === 503 ? 'Archive actions require MongoDB replica-set transactions. Ask your administrator to configure the database.' : 'The archive operation could not be confirmed. Refresh the list before retrying.' });
}

// OPERATIONAL DELETE ROUTES
// ARCHIVE ENDPOINTS OF ADMIN ROUTE
async function archiveResponse(req, res, category, id = req.params.id) {
  try { return res.json(await service.mutate(category, id, 'archive', req.user)); }
  catch (error) { return archiveError(res, error); }
}

function createArchiveRouter({ requireAuth, requireAdmin, Employee, archiveService = service }) {
  const router = express.Router();
  router.use(requireAuth, requireAdmin);
  router.get('/categories', (req, res) => res.json([...archiveService.registry.values()].map(({ key, label, note, status }) => ({ key, label, note, hasStatus: Boolean(status) }))));
  router.get('/:category', async (req, res) => {
    try { res.json(await archiveService.list(req.params.category, req.query)); }
    catch (error) { archiveError(res, error); }
  });
  router.patch('/:category/:id/restore', async (req, res) => {
    try { res.json(await archiveService.mutate(req.params.category, req.params.id, 'restore', req.user)); }
    catch (error) { archiveError(res, error); }
  });
  
  // SOFT DELETE
  router.post('/:category/:id/archive', async (req, res) => {
    try { res.json(await archiveService.mutate(req.params.category, req.params.id, 'archive', req.user)); }
    catch (error) { archiveError(res, error); }
  });
  const attempts = new Map();
  router.delete('/:category/:id', async (req, res) => {
    try {
      const category = archiveService.getCategory(req.params.category);
      archiveService.recordKey(category, req.params.id);
      const { password, confirmation, reason } = req.body || {};
      if (confirmation !== `${category.key}:${req.params.id}` || typeof reason !== 'string' || reason.trim().length < 5 || reason.length > 500 || typeof password !== 'string' || !password || password.length > 128) {
        return res.status(400).json({ error: 'Provide the exact record confirmation, your password, and a reason (5–500 characters).' });
      }
      const now = Date.now();
      for (const [key, attempt] of attempts) if (attempt.until <= now) attempts.delete(key);
      const attempt = attempts.get(req.user.sub) || { count: 0, until: now + 15 * 60 * 1000 };
      if (attempt.count >= 5) return res.status(429).json({ error: 'Too many password attempts. Try again in 15 minutes.' });
      attempt.count += 1; attempts.set(req.user.sub, attempt);
      const actor = await Employee.findById(req.user.sub);
      const stored = actor?.portal_access?.password;
      if (!stored?.startsWith('$2') || !await bcrypt.compare(password, stored)) return res.status(403).json({ error: 'Password confirmation failed. Sign in again if your account needs a password upgrade.' });
      attempts.delete(req.user.sub);
      res.json(await archiveService.mutate(category.key, req.params.id, 'purge', req.user, reason.trim()));
    } catch (error) { archiveError(res, error); }
  });
  return router;
}
module.exports = { createArchiveRouter, archiveResponse, archiveError };
