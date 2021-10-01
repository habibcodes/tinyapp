const bcrypt = require('bcryptjs');

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

const hashedPass1 = bcrypt.hashSync('gandalf', 10);
const hashedPass2 = bcrypt.hashSync('frodo333', 10);

const usersDb = {
  "jd2343": {
    id: "jd2343",
    email: "bilbo@theshire.com",
    password: hashedPass1
  },
  "sk9823": {
    id: "sk9823",
    email: "samwise@theshire.com",
    password: hashedPass2
  }
};

module.exports = {
  urlDatabase,
  usersDb,
};