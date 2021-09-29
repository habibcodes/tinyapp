const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');


// middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('tiny'));
app.use(cookieParser());

// template engine
app.set('view engine', 'ejs');
// hardcoded DB
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const usersDb = {
  "jd2343": {
    id: "jd2343",
    email: "bilbo@theshire.com",
    password: "gandalf"
  },
  "sk9823": {
    id: "sk9823",
    email: "samwise@theshire.com",
    password: "frodo333"
  }
};


app.get('/', (req, res) => {
  res.send('hello~');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b> World</b></body></html>\n');
});

app.get('/urls', (req, res) => {
  const templateVars = {
    user:  usersDb[req.cookies["userId"]],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

// stackOverflow
const generateRandomString = () => {
  const randomStr = (Math.random() + 1).toString(36).substring(7);
  return randomStr;
};

// show form must precede id route
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user:  usersDb[req.cookies["userId"]],
  };
  res.render('urls_new', templateVars);
});

// generate random string and add it to the db in POST
app.post('/urls', (req, res) => {
  // destructured longURL from req
  const {longURL} = req.body;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// pull and display urls from DB
app.get('/urls/:shortURL', (req, res) => {
  const {shortURL} = req.params;
  const longURL = urlDatabase[shortURL];
  const user = usersDb[req.cookies["userId"]];
  const templateVars = {
    shortURL,
    longURL,
    user
  };
  res.render('urls_show', templateVars);
});

// UPDATE (edit)
app.post('/urls/:id', (req, res) => {
  // extract shortURL id from req.params.shortURL
  const {id} = req.params;
  // extract update info from req.body.{name of input}
  const {updateURL} = req.body;
  // pass data from req.body.updateURL to urlDatabase
  urlDatabase[id] = updateURL;
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
app.post('/login', (req, res) => {
  // parse req.body.username
  const {username} = req.body;
  // set cookie to the value of username via res.cookie
  res.cookie('username', username);
  // redirect back to /urls
  res.redirect('/urls');
});
// logout
app.post('/logout', (req, res) => {
  // clear cookie and redirect to /urls
  res.clearCookie('username');
  res.redirect('/urls');
});

// Auth Helper Funcs //
// checks entered email against db emails
// if exists, sets user to db usersId
const findUserByEmail = (email, usersDb) => {
  for (let userId in usersDb) {
    const userInDb = usersDb[userId];
    if (email === userInDb.email) {
      return userInDb;
    }
  }
  return false;
};

// creates new user with email and pass
const createUser = (email, password, usersDb) => {
  const userId = generateRandomString();
  // create new user object
  usersDb[userId] = {
    id: userId,
    email,
    password
  };
  return userId;
};

// user auth function
const authenticateUser = (email, password, usersDb) => {
  // call user from usersDb
  const userFound = findUserByEmail(email, usersDb);

  // compare password against one in usersDb
  if (userFound && userFound.password === password) {
    return userFound;
  }
  return false;
};

// get register form
app.get('/register', (req, res) => {
  //
  // const username = req.cookies["username"];
  const templateVars = {user: null};
  res.render('register', templateVars);
});

// register POST route
app.post('/register', (req, res) => {
  // retrieve username/pass from req.body
  // save those to variables
  const {email, password} = req.body;
  console.log(req.body);

  // check if user in db
  const userFound = findUserByEmail(email, usersDb);
  console.log('userFound: ', userFound);

  // if user in usersDb, return user exists error
  if (userFound) {
    res.status(401).send('That user already exists. Please enter your password or try again.');
    return; // terminates and exits here
  }

  // if not in usersDb = new user -> register to db as new user
  const newUser = createUser(email, password, usersDb);
  console.log(newUser);

  // set the user to cookie
  res.cookie('userId', newUser);

  // redirect to /urls
  res.redirect('urls');

  // push that to a "users" object in DB
  // create fake userID with func
  console.log(usersDb);
});



app.get('*', function(req, res) {
  res.status(404).send('404: shortURL not found.');
});


app.listen(PORT, () => {
  console.log(`Example app listening on Port: ${PORT}!`);
});