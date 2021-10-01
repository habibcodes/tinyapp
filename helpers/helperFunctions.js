const bcrypt = require('bcryptjs');
const {urlDatabase, usersDb} = require('../database/database');


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
  if (userFound && bcrypt.compareSync(password, userFound.password)) {
    return userFound;
  }
  return false;
};

// stackOverflow
const generateRandomString = () => {
  const randomStr = (Math.random() + 1).toString(36).substring(7);
  return randomStr;
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

// hashedPass
const hashPassword = (unhashedPass) => {
  const hashedPass = bcrypt.hashSync(unhashedPass, 10);
  return hashedPass;
};

module.exports = {
  findUserByEmail,
  createUser,
  authenticateUser,
  generateRandomString,
  userLinks,
  hashPassword,
};