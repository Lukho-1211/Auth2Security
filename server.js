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

const app = express();

app.use(helmet());

app.use(cookieSession({ //Creation of a cookie
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000, //last for 1 day
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ],
}));  

app.use(passport.initialize());

function checkLogedIn(req, res, next){
    const isLogIn = true;
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
        session: false,
    }), 
    (req, res)=>{
        console.log('Google called us Back!!!');
    }
);

app.get('/google/logout',(req, res, next)=>{});

app.get('/secret', checkLogedIn, (req,res)=>{
    res.send('my secret');
});

app.get('/failure', (req, res)=>{
    res.send('Failed to login');
});


app.listen(PORT,()=>{
    console.log(`listerning to port ${PORT}...`);
});

// https.createServer({
//     key: fs.readFileSync('key.pem'),
//     cert: fs.readFileSync('cert.pem'),
//    },app)