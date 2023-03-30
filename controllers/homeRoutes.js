const router = require('express').Router();
const { route, User } = require('../models');
const withAuth = require('../utils/auth');

router.get('/', withAuth,(req, res) => {
  
    res.render('chat',{logged_in:req.session.logged_in});
 
});

router.get('/route/:id', async (req, res) => {
  try {
    const routeData = await route.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['name'],
        },
      ],
    });

    const route = routeData.get({ plain: true });

    res.render('route', {
      ...route,
      logged_in: req.session.logged_in
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/login', (req, res) => {
  // If the user is already logged in, redirect the request to another route
  if (req.session.logged_in) {
    res.redirect('/');
    return;
  }

  res.render('login');
});

module.exports = router;