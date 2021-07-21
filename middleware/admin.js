module.exports = (req, res, next) => {
    if (req.session.isLoggedIn && req.user.role === 'admin') {
        return next();
    }

    return res.redirect('/login');
};
