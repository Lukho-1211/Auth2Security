const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const cookieSession = require('cookie-session');
const { Strategy } = require('passport-google-oauth20');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2,
}

const AUTH_OPTIONS ={
    callbackURL: '/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
}

function verifyCallBack(accessToken, refreshToken, profile, done){
    console.log('Google Profile', profile);
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallBack));

    // Save the session to cookie
passport.serializeUser((user, done)=>{   
    done(null, user.id); // can save the entire user[object] or parts of the session
});

    // Read the session to cookie
passport.deserializeUser((id, done)=>{ // can also save the id here to the database 
    // User.findbyId(id).then(user =>{
    //     done(null, user);
    // })
    done(null, id);
});

const app = express();

app.use(helmet());

app.use(cookieSession({ //Creation of a cookie
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, //last for 1 day
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ],
}));  

app.use(passport.initialize());

// responsible to call [ deserializeUser] 
app.use(passport.session()); // authenticates the session with [COOKIE_KEY_1] and set req.user

function checkLogedIn(req, res, next){
    console.log('current user Id:', req.user);
    const isLogIn = req.user;
    if(!isLogIn){
        return res.status(401).json({
            error: 'You must log in'
        });
    }
    next();
}


app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'));
});

app.get('/auth/google', 
    passport.authenticate('google',
        {
         scope: ['email']
        }
    )
);

app.get('/auth/google/callback', 
    passport.authenticate('google',{
        failureRedirect: '/failure',
        successRedirect: '/',
        session: true,
    }), 
    (req, res)=>{
        console.log('Google called us Back!!!');
    }
);

app.get('/auth/logout',(req, res, next)=>{
    req.logout(); // removes req.user and clears any log in session
    return res.redirect('/');
});

app.get('/secret', checkLogedIn, (req,res)=>{
    res.send('my secret value is 12');
});

app.get('/failure', (req, res)=>{
    res.send('Failed to login');
});


app.listen(PORT,()=>{
    console.log(`listerning to port ${PORT}...`);
});

export default app;
// https.createServer({
//     key: fs.readFileSync('key.pem'),
//     cert: fs.readFileSync('cert.pem'),
//    },app)
