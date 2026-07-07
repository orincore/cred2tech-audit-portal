const { getSessionFromReq } = require('./session');

function requireAuthApi(handlerFn) {
  return async function wrapped(req, res) {
    const session = getSessionFromReq(req);
    if (!session) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    return handlerFn(req, res, session);
  };
}

module.exports = { requireAuthApi };
