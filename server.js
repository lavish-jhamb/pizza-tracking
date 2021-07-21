require('dotenv').config();

const path = require('path')

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const flash = require('express-flash')
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session')(session);
const Emitter = require('events');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

const User = require('./models/user');




// CREATING MONGODB SESSION STORAGE
const store = new mongodbStore({
    uri: 'mongodb://localhost/pizza',
    collection: 'sessions',
})

// EVENT EMITTER => 
const eventEmitter = new Emitter();

app.set('eventEmitter', eventEmitter)




// SETTING UP SESSION"S
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { maxAge: 1000 * 60 * 24 }
}))

app.use(flash())

// SERVING STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// PARSE JSON DATA ON SERVER => PUSHING BY FRONTEND
app.use(bodyParser.json());

// FOR BODY REQ => urlencoded data
app.use(bodyParser.urlencoded({ extended: false }));

// SET UP VIEW ENGINE
app.set('view engine', 'ejs');

// GLOBAL MIDDLEWARE FOR STORING SESSION
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.isAuthenticated = req.session.isLoggedIn // => TRUE IF PASSWORD MATCH IN LOGIN FORM
    next()
})

// SETTING MIDDLEWARRE TO STORE A USER IN A REQ BODY SO WE CAN USE IT IN DIFFERNT ROUTES AND CONTROLLER
app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next()
            }
            req.user = user
            next();
        }).catch(err => {
            console.log(err)
        })
})

app.use(shopRoutes);
app.use(authRoutes);
app.use(adminRoutes);





const PORT = process.env.PORT || 8080

const server = app.listen(PORT);


mongoose.connect('mongodb://localhost/pizza')
    .then(() => {
        console.log('connection has been made')
    }
    )
    .catch(err => {
        console.log(err)
    })

// ####### SOCKET IO  ######### =>
const io = require('./socket.io').init(server);

io.on('connection', (socket) => {
    // listening for orders Id => FROM FRONTENT(CLIENT)
    socket.on('join', (orderId) => {
        // JOIN ROOM
        socket.join(orderId)
    })
})

eventEmitter.on('orderUpdated', data => {
    io.to(`order_${data.id}`).emit('orderUpdated', data);
})

eventEmitter.on('orderPlaced', data => {
    io.to('adminRoom').emit('orderPlaced', data)
})