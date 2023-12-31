const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { title: 'Express' });
});

router.post('/register', async (req, res) => {
  const errors = [];

  if (req.body.password !== req.body.passwordConf) {
    errors.push('The provided passwords do not match.');
  }

  if (
    !(
      req.body.email &&
      req.body.username &&
      req.body.password &&
      req.body.passwordConf
    )
  ) {
    errors.push('All fields are required.');
  }

  const selectQuery = 'SELECT * FROM customers WHERE username = $1';
  const selectResult = await db.query(selectQuery, [req.body.username]);
  console.log(selectResult);

  if (selectResult.rows.length > 0) {
    errors.push('That username is already taken.');
  }

  if (!errors.length) {
    const insertQuery =
      'INSERT INTO customers (username, email, password) VALUES ($1, $2, $3)';
    const password = await bcrypt.hash(req.body.password, 10);
    await db.query(insertQuery, [req.body.username, req.body.email, password]);

    res.redirect('login');
  } else {
    res.render('register', { errors });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Express' });
});

router.post('/login', async (req, res) => {
  const errors = [];

  const selectQuery = 'SELECT * FROM customers WHERE username = $1';
  const selectResult = await db.query(selectQuery, [req.body.username]);

  if (selectResult.rows.length === 1) {
    const auth = await bcrypt.compare(
      req.body.password,
      selectResult.rows[0].password
    );

    if (auth) {
      [req.session.user] = selectResult.rows;
      console.log('user: ', req.session.user);
      req.session.save(() => res.redirect('/'));
    } else {
      errors.push('Incorrect username/password');
      res.render('login', { errors });
    }
  } else {
    errors.push('Incorrect username/password');
    res.render('login', { errors });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/change-password', (req, res) => {
  res.render('change-password', { title: 'Change Password' });
});

router.post('/change-password', async (req, res) => {
  const errors = [];

  const selectQuery = 'SELECT * FROM customers WHERE username = $1';
  const selectResult = await db.query(selectQuery, [req.session.user.username]);

  if (selectResult.rows.length === 1) {
    const auth = await bcrypt.compare(
      req.body.old_password,
      selectResult.rows[0].password
    );

    if (auth) {
      if (req.body.new_password !== req.body.new_password_conf) {
        errors.push('The provided new passwords do not match.');
        res.render('change_password', { title: 'Change Password', errors });
      } else {
        const newPassword = await bcrypt.hash(req.body.new_password, 10);
        const updateQuery =
          'UPDATE customers SET password = $1 WHERE username = $2';
        await db.query(updateQuery, [newPassword, req.session.user.username]);
        res.redirect('/users/login');
      }
    } else {
      errors.push('Incorrect current password');
      res.render('change_password', { title: 'Change Password', errors });
    }
  } else {
    errors.push('User not found');
    res.render('change_password', { title: 'Change Password', errors });
  }
});

module.exports = router;
