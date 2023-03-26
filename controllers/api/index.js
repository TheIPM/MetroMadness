const router = require('express').Router();
const userRoutes = require('./userRoutes');
const projectRoutes = require('./routeRoutes');

router.use('/users', userRoutes);
router.use('/routes', routeRoutes);

module.exports = router;