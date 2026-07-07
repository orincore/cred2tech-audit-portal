const { getSessionFromReq } = require('./session');

function requireAuthPage(getServerSidePropsFn) {
  return async function wrapped(context) {
    const session = getSessionFromReq(context.req);
    if (!session) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    if (getServerSidePropsFn) {
      const inner = await getServerSidePropsFn(context, session);
      return { ...inner, props: { ...(inner.props || {}), session } };
    }
    return { props: { session } };
  };
}

module.exports = { requireAuthPage };
