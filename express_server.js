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
    username: req.cookies["username"],
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
  const templateVars = {username: req.cookies["username"]};
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
  const username = req.cookies["username"];
  const templateVars = { shortURL, longURL, username};
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



app.get('*', function(req, res) {
  res.status(404).send('404: shortURL not found.');
});


app.listen(PORT, () => {
  console.log(`Example app listening on Port: ${PORT}!`);
});