//-------------All required packages:
const router = require('express').Router();
const { User } = require('../../models');

//-------------Where a new user signs up:
router.post('/signup', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const userData = await User.create(req.body);
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;
      res.status(200).json(userData);
    });
  } catch (err) {
    console.log('Signup error:', err);
    res.status(400).json({ message: err.message });
  }
});

//-------------User already signed up and just needs to login:
router.post('/login', async (req, res) => {
  try {
    const userData = await User.findOne({ where: { email: req.body.email } });

    if (!userData) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again' });
      return;
    }
    const validPassword = await userData.checkPassword(req.body.password);
    if (!validPassword) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again' });
      return;
    }
    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.username = userData.name; 
      req.session.logged_in = true;

      req.session.user_id = userData.id;
      res.json({ user: userData, message: 'You are now logged in!' });
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

//-------------User logs out:
router.post('/logout', (req, res) => {
  // When the user logs out, destroy the session
  if (req.session.logged_in) {
    req.session.destroy(() => {
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});

//-------------exporting the page:
module.exports = router;