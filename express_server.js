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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "jd2343"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "sk9823"
  }
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

const userLinks = (userId) => {
  const userSites = {};
  for (let url in urlDatabase) {
    if (userId === urlDatabase[url].userID) {
      userSites[url] = urlDatabase[url];
    }
  }
  return userSites;
};


app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b> World</b></body></html>\n');
});

// display all short/long URLS
app.get('/urls', (req, res) => {
  const userURLS  = userLinks(req.cookies["userId"]);
  const templateVars = {
    user:  usersDb[req.cookies["userId"]],
    urls: userURLS,
  };
  // check if user logged in
  if (!req.cookies['userId']) {
    res.status(401).send('Not logged in!');
  }
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
  // retrieve userId from cookie
  const userId = req.cookies["userId"];
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
  console.log(urlDatabase);
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
  const user = usersDb[req.cookies["userId"]];
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
  console.log(id);
  // extract update info from req.body.{name of input}
  const {updateURL} = req.body;
  console.log(updateURL);
  // pass data from req.body.updateURL to urlDatabase
  urlDatabase[id].longURL = updateURL;
  console.log(urlDatabase);
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
  // lookup user and if user found in usersDb, let them in
  if (user) {
    // if user in usersDb, set cookies to user
    res.cookie('userId', user.id);
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
  // clear cookie and redirect to /urls
  const userId =  req.cookies["userId"];
  res.clearCookie('userId');
  res.redirect('/login');
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

  // errors for empty username/pass
  if (req.body.email === '' || req.body.password === '') {
    //
    res.status(400).send('Please enter a valid username and password.');
    return;
  }

  // check if user in db
  const userFound = findUserByEmail(email, usersDb);
  console.log('userFound: ', userFound);

  // if user in usersDb, return user exists error
  if (userFound) {
    res.status(400).send('That user already exists. Please enter your password or try again.');
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