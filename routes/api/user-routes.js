const router = require('express').Router();
const { User } = require('../../models');
const withAuth = require('../../utils/auth');

//new user
router.post('/', async (req, res) => {
  try {
    const newUser = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    req.session.save(() => {
      req.session.userId = newUser.id;
      req.session.username = newUser.username;
      req.session.email = newUser.email;
      req.session.loggedIn = true;

      res.json(newUser);
    });
  } catch (err) {
    res.status(500).json(err);
  }
});
//get single user
router.get('/:id', (req, res) => {
  User.findOne({
      attributes: { exclude: ['password'] },where: {id: req.params.id},
      include: [{ model: Post, attributes: ['id', 'title', 'post_text', 'created_at']},
        {model: Comment, attributes: ['id', 'comment_text', 'created_at'],
          include: { model: Post, attributes: ['title']}}]})
      .then(dbUserData => {
          if (!dbUserData) {
              res.status(404).json({ message: 'No user  with this id'});
              return;
          }
          res.json(dbUserData);
      })
      .catch(err => {
          console.log(err);
          res.status(500).json(err);
      });
});

// GET /api/users
router.get('/',  (req, res) => {
  User.findAll({attributes: { exclude: ['[password']}})
  .then(dbUserData => res.json(dbUserData))
  .catch(err => {
      console.log(err); 
      res.status(500).json(err);
  });
});

//log in
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      res.status(400).json({ message: 'No user account found!' });
      return;
    }

    const validPassword = user.checkPassword(req.body.password);

    if (!validPassword) {
      res.status(400).json({ message: 'No user account found!' });
      return;
    }

    req.session.save(() => {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.email = user.email;
      req.session.loggedIn = true;

      res.json({ user, message: 'You are now logged in!' });
    });
  } catch (err) {
    res.status(400).json({ message: 'No user account found!' });
  }
});
//logout
router.post('/logout', (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy(() => {
      res.redirect('login');
      res.status(204).end();
    });
  } else {
    res.status(404).end();
  }
});
//update
router.put('/:id', withAuth, (req, res) => {
  User.update(req.body, {
      individualHooks: true,
      where: {
          id: req.params.id
      }
  })
  .then(dbUserData => {
      if (!dbUserData[0]) {
          res.status(404).json({ message: 'No user with this id'});
          return;
      }
      res.json(dbUserData);
  })
  .catch(err => {
      console.log(err); 
      res.status(500).json(err);
  });
});


//delete
router.delete('/:id', withAuth, (req, res) => {
  User.destroy({
      where: {
          id: req.params.id
      }
  })
      .then(dbUserData => {
          if (!dbUserData) {
              res.status(404).json({ message: 'No user with this id'});
              return;
          }
          res.json(dbUserData);
      })
      .catch(err => {
          console.log(err);
          res.status(500).json(err);
      });
});


module.exports = router;
