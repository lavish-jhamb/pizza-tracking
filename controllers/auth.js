const bcrypt = require('bcryptjs');

const User = require('../models/user');



let _getRedirectURL = (req) => {
    return req.session.user.role === 'admin' ? '/admin/orders' : '/customer/orders';
}



exports.getRegister = (req, res, next) => {
    res.render('register', {
        errorMessage: req.flash('error'),
    });
}

exports.postRegister = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'Email Already Exists please pick another one!');
                return res.redirect('/register')
            }

            return bcrypt.hash(password, 12)
        })
        .then(hashedPw => {
            const user = new User({
                name: name,
                email: email,
                password: hashedPw
            })

            return user.save();
        })
        .then(result => {
            console.log(result)
            console.log('user saved succesfully!')
            return res.redirect('/login');
        })
        .catch(err => console.log(err))
}

exports.getLogin = (req, res, next) => {
    res.render('login', {
        errorMessage: req.flash('error'),
    });
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email })
        .then(user => {
            console.log(user)
            if (!user) {
                req.flash('error', 'Please Register yourself First!')
                return res.redirect('/register')
            }

            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err)
                            res.redirect(_getRedirectURL(req))
                        })
                    }
                    req.flash('error', 'Incorrect Password')
                    return res.redirect('/login')
                }).catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        })
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err)
        res.redirect('/')
    })
}
