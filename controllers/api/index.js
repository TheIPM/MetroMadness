//-------------All required packages:
const router = require('express').Router();
const userRoutes = require('./userRoutes');
//-------------All required routes:
router.use('/users', userRoutes);
router.use('/routes', routeRoutes);
//-------------Exporting index.js file:
module.exports = router;