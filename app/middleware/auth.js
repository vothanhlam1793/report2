module.exports = function (req, res, next) {
  if (req.session && req.session.user) {
    return next()
  }
  if (req.path === '/login' || req.path === '/logout') {
    return next()
  }
  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl))
}
