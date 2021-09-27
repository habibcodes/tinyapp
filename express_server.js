const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');


// middleware
app.use(bodyParser.urlencoded({extended: true}));

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
  const templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});


// show form must precede id route
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.post('/urls', (req, res) => {
  console.log(req.body);
  res.send('OK');
});

const generateRandomString = () => {
  //
};

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render('urls_show', templateVars);
});




app.listen(PORT, () => {
  console.log(`Example app listening on Port: ${PORT}!`);
});