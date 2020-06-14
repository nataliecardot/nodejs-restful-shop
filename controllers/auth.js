const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    // Keep errors that were retrieved by validation package
    error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  // Generates hashed password. Asynchronous task; returns a promise. Second arg is salt value (how many rounds of hashing will be applied)
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email,
        password: hashedPw,
        name,
      });
      return user.save();
    })
    .then((result) => {
      // Result is user object; can extract userId from it
      // 201: Created. Request has been fulfilled and resulted in a new resource being created
      res.status(201).json({ message: 'User created!', userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error('A user with this email could not be found.');
        error.statusCode = 401; // 401: not authenticated
        throw error;
      }
      // User with provided email exists
      loadedUser = user;
      // Check whether submitted password matches hashed password stored for user in db
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Incorrect password.');
        error.statusCode = 401;
        throw error;
      }
      // Entered password is correct. Generate JSON web token
      // sign method creates a new signature and packs it into a new JSON web token. Second arg is the secret, the private key used for signing
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        'somesupersecretsecret',
        { expiresIn: '1h' }
      );
      res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
