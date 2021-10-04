// dependencies
const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const morgan = require('morgan');
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
  if (!req.session['userId']) {
    res.status(401).send('Not logged in!');
    return;
  }
  res.render('urls_index', templateVars);
});

// get new URL form if user signed in
app.get('/urls/new', (req, res) => {
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
  const userId = req.session["userId"];
  if (!userId) {
    res.status(401).send('Not logged in!');
  }
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId
  };
  res.redirect('/urls');
});

// pull and display urls from DB if user signed in and owns data
app.get('/urls/:shortURL', (req, res) => {
  // extract params and database value
  const {shortURL} = req.params;
  const user = usersDb[req.session["userId"]];
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send('Not logged in!');
  }
  if (userId !== urlDatabase[shortURL].userID) {
    return res.status(401).send('You are not authorised to edit this URL!');
  }
  // error if no shortURL
  if (!urlDatabase[shortURL]) {
    return res.status(404).send('ShortURL not found.');
  }
  const longURL = urlDatabase[shortURL].longURL;
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
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).send('Not logged in!');
  }
  const {id} = req.params;
  // check if user logged in
  if (userId !== urlDatabase[id].userID) {
    res.status(401).send('You are not authorised to edit this URL!');
  }
  // extract update info from req.body.{name of input}
  const {updateURL} = req.body;
  urlDatabase[id].longURL = updateURL;
  res.redirect('/urls');
});

// delete urls
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  // retrieve userId from cookie
  const userId = req.session["userId"];
  // check if user logged in
  if (!userId) {
    res.status(401).send('Not logged in!');
  }
  // check if user logged in owns the shortURL being accessed
  if (userId !== urlDatabase[shortURL].userID) {
    res.status(401).send('You are not authorised to delete this URL!');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// Authentication Routes //
// login; clear previous users
app.get('/login', (req, res) => {
  const templateVars = {user: null};
  res.render('login', templateVars);
});

// login
app.post('/login', (req, res) => {
  const {email, password} = req.body;
  // if not find by email
  if (!findUserByEmail(email, usersDb)) {
    res.status(403).send('User not found');
  }
  // authenticate against usersDb for email/pass
  const user = authenticateUser(email, password, usersDb);
  // lookup user and if user found in usersDb, let them in
  if (user) {
    // if user in usersDb, set cookies to user
    req.session.userId = user.id;
    console.log(user.id);
    // rdirect to /urls
    res.redirect('/urls');
    return;
  } else {
    res.status(403).send('Incorrect password.');
  }
  // if not able to auth, send error 401
  res.status(401).send('Incorrect username or password.');
});

// logout
// clear cookie and redirect to /login
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// get register form
app.get('/register', (req, res) => {
  const templateVars = {user: null};
  res.render('register', templateVars);
});

// register POST route, sets cookies and hashed password
app.post('/register', (req, res) => {
  const {email, password} = req.body;
  const hashedPass = hashPassword(password);
  console.log(hashedPass);
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('Please enter a valid username and password.');
    return;
  }

  // check if user in db
  // if user in usersDb, else return user exists error
  const userFound = findUserByEmail(email, usersDb);
  if (userFound) {
    res.status(400).send('That user already exists. Please enter your password or try again.');
    return;
  }
  const newUserId = createUser(email, hashedPass, usersDb);
  req.session.userId = newUserId;
  res.redirect('urls');
});

// open port and listen
app.listen(PORT, () => {
  console.log(`Example app listening on Port: ${PORT}!`);
});