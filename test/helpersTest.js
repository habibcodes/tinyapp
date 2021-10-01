const { assert } = require('chai');

const { findUserByEmail } = require('../helpers/helperFunctions');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user object from which an id can be extracted', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const userId = user.id;
    const expectedOutput = "userRandomID";
    assert.equal(userId, expectedOutput);
  });
  it('should return undefined if a user is not in the database', function() {
    const user = findUserByEmail("user@example555.com", testUsers);
    const userId = user.id;
    // asserts value returned is undefined
    assert.isUndefined(userId);
  });
});