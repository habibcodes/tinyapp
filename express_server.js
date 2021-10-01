// dependencies
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const morgan = require('morgan');
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
// helper funcs
const {findUserByEmail, createUser,authenticateUser, generateRandomString, userLinks, hashPassword} = require('./helpers/helperFunctions');
// dbs
const {urlDatabase, usersDb} = require('./database/database');

// Middleware //
app.use(morgan('tiny'));
app.use(cookieSession({
  name: 'session',
  keys: ['lknt42fnoh90hn2hf90w8fhofnwe','some other Very long stTring'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));

// Template Engine //
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// display all short/long URLS
app.get('/urls', (req, res) => {
  const userURLS  = userLinks(req.session["userId"]);
  const templateVars = {
    user:  usersDb[req.session["userId"]],
    urls: userURLS,
  };
  // check if user logged in
  if (!req.session['userId']) {
    res.status(401).send('Not logged in!');
    return;
  }
  res.render('urls_index', templateVars);
});

// show form must precede id route
app.get('/urls/new', (req, res) => {
  // check if user
  if (!req.session["userId"]) {
    return res.redirect('/');
  }
  const templateVars = {
    user:  usersDb[req.session["userId"]],
  };
  res.render('urls_new', templateVars);
});

// generate random string and add it to the db in POST
app.post('/urls', (req, res) => {
  // retrieve userId from cookie
  const userId = req.session["userId"];
  // check if user logged in
  if (!userId) {
    res.status(401).send('Not logged in!');
  }
  // destructured longURL from req
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  };
  res.redirect('/urls');
});

// pull and display urls from DB
app.get('/urls/:shortURL', (req, res) => {
  // extract params and database value
  const {shortURL} = req.params;
  // error if no shortURL
  if (!urlDatabase[shortURL]) {
    res.status(404).send('ShortURL not found.');
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  const user = usersDb[req.session["userId"]];
  const templateVars = {
    shortURL,
    longURL,
    user
  };
  res.render('urls_show', templateVars);
});

// redirect shortURL to longURL
app.get('/u/:shortURL', (req, res) => {
  const {shortURL} = req.params;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// UPDATE (edit)
app.post('/urls/:id', (req, res) => {
  // extract shortURL id from req.params.shortURL
  const {id} = req.params;
  // extract update info from req.body.{name of input}
  const {updateURL} = req.body;
  // pass data from req.body.updateURL to urlDatabase
  urlDatabase[id].longURL = updateURL;
  // redirect
  res.redirect('/urls');
});

// delete urls
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// Authentication Routes //
// login
app.get('/login', (req, res) => {
  // clear user profile
  const templateVars = {user: null};
  // render login page
  res.render('login', templateVars);
});
// login
app.post('/login', (req, res) => {
  // parse login info from req.body
  const {email, password} = req.body;
  // if not find by email
  if (!findUserByEmail(email, usersDb)) {
    res.status(403).send('User not found');
  }
  // authenticate against usersDb for email/pass
  const user = authenticateUser(email, password, usersDb);
  console.log('logging user line 158', user);
  // lookup user and if user found in usersDb, let them in
  if (user) {
    // if user in usersDb, set cookies to user
    req.session.userId = user.id;
    console.log(user.id);
    // rdirect to /urls
    res.redirect('/urls');
    return; // exit from func here
  } else {
    res.status(403).send('Incorrect password.');
  }
  // if not able to auth, send error 401
  res.status(401).send('Incorrect username or password.');
});

// logout
app.post('/logout', (req, res) => {
  // clear cookie and redirect to /login
  req.session = null;
  console.log('from logout', req.session);
  res.redirect('/login');
});

// get register form
app.get('/register', (req, res) => {
  // const username = req.cookies["username"];
  const templateVars = {user: null};
  res.render('register', templateVars);
});

// register POST route
app.post('/register', (req, res) => {
  // retrieve username/pass from req.body
  // save those to variables
  const {email, password} = req.body;
  const hashedPass = hashPassword(password);
  console.log(hashedPass);

  // errors for empty username/pass
  if (req.body.email === '' || req.body.password === '') {
    //
    res.status(400).send('Please enter a valid username and password.');
    return;
  }

  // check if user in db
  const userFound = findUserByEmail(email, usersDb);
  // if user in usersDb, return user exists error
  if (userFound) {
    res.status(400).send('That user already exists. Please enter your password or try again.');
    return; // terminates and exits here
  }

  // if not in usersDb = new user -> register to db as new user
  const newUserId = createUser(email, hashedPass, usersDb);
  console.log(newUserId);
  console.log(usersDb[newUserId]);
  
  // set the session cookie to user here
  req.session.userId = newUserId;
  // redirect to /urls
  res.redirect('urls');
});

// handles all 404 errors
app.get('*', function(req, res) {
  res.status(404).send('404: shortURL not found.');
});

// open port and listen
app.listen(PORT, () => {
  console.log(`Example app listening on Port: ${PORT}!`);
});