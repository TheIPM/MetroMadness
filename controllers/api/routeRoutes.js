const router = require('express').Router();
const { Route } = require('../../models');
const withAuth = require('../../utils/auth');

router.post('/', withAuth, async (req, res) => {
  try {
    // const newProject = await Project.create({
    const newRoute = await Route.create({
      ...req.body,
      user_id: req.session.user_id,
    });

    res.status(200).json(newRoute);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete('/:id', withAuth, async (req, res) => {
  try {
    const RouteData = await Route.destroy({
      where: {
        id: req.params.id,
        user_id: req.session.user_id,
      },
    });

    if (!RouteData) {
      res.status(404).json({ message: 'No Route found with this id!' });
      return;
    }

    res.status(200).json(RouteData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
