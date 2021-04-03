const express = require('express');
morgan = require('morgan');
mongoose = require('mongoose');
Models = require('./models.js');
bodyParser = require('body-parser');

const Movies = Models.Movie;
const Users = Models.User;

// Comment here
// mongoose.connect('mongodb://localhost:27017/myFlixDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const app = express();

app.use(morgan('common'));

app.use(bodyParser.json());

let auth = require('./auth')(app);

const passport = require('passport');
require('./passport');

const cors = require('cors');
app.use(cors());    // allows requests from all origins

const { check, validationResult } = require('express-validator');
let allowedOrigins = ['https://sharmilamovie.herokuapp.com/', 'http://localhost:8080', 'http://localhost:1234', 'http://localhost:3209'];

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

// Returns a list of all movies
app.get('/movies',passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Returns data about a single movie, by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.status(201).json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Returns information about a genre, by name/title
app.get('/movies/Genres/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.status(201).json(movie.Genre.Name + '. ' + movie.Genre.Description);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Returns information about a director, by name
app.get('/movies/Directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
        .then((movie) => {
            res.status(201).json(movie.Director.Name + ': ' + movie.Director.Bio);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Add movies
app.post('/movies',passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({Title: req.body.Title})
    .then((movie) => {
        if (movie) { //if the user is found, send a response that it already exists
            return res.status(400).send(req.body.Title + ' already exists');
        } else {
            Movies.create({
                Title: req.body.Title,
                Description: req.body.Description,
                Genre: req.body.Genre,
                Director: req.body.Director,
                ImagePath: req.body.ImagePath,
                Featured: req.body.Featured
            })
                .then((movie) => { res.status(201).json(movie) })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                });
        }
    })
}
)

//Delete Movies
app.delete('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOneAndRemove({
        Title: req.params.Title
    })
        .then((movie) => {
            if (!movie) {
                res.status(400).send(req.params.Title + ' was not found.');
            } else {
                res.status(200).send(req.params.Title + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Allows (post) new user registration
app.post('/users',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {

        let errors = validationResult(req); //checks the validation object for errors

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);

        Users.findOne({ Username: req.body.Username }) //search to see if a user with the requested username already exists
            .then((user) => {
                if (user) { //if the user is found, send a response that it already exists
                    return res.status(400).send(req.body.Username + ' already exists');
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                        .then((user) => { res.status(201).json(user) })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

//Allows (put) users to update their user information
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], (req, res) => {
        let errors = validationResult(req); //checks the validation object for errors

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);

        Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
            { new: true },
            (err, updatedUser) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                } else {
                    res.status(201).json(updatedUser);
                }
            });
    });

//Allows (post) users to add a movie to their list of favorites
app.post('/users/:Username/Movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $push: { FavoriteMovies: req.params.MovieID }
        },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

//Allows users to remove (delete) a movie from their list of favorites
app.delete('/users/:Username/Movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate(
        { Username: req.params.Username },
        {
            $pull: { FavoriteMovies: req.params.MovieID }
        },
        { new: true },
        (err, updatedUser) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            } else {
                res.json(updatedUser);
            }
        });
});

//Deletes a user from database/allows existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({
        Username: req.params.Username
    })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found.');
            } else {
                res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something\'s not right!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});


// const express = require('express'),
//   morgan = require('morgan'),
//   mongoose = require('mongoose'),
//   Models = require('./models.js'),
//   app = express(),
//   bodyParser = require('body-parser');

// const cors = require('cors');
// app.use(cors());

// const passport = require('passport');
//   require('./passport');

// app.use(bodyParser.json());
// let auth = require('./auth')(app);

// const { check, validationResult } = require('express-validator');

// const Movies = Models.Movie;
// const Users = Models.User;

// app.use(morgan('common'));

// let allowedOrigins = ['https://sharmilamovie.herokuapp.com/', 'http://localhost:8080', 'http://localhost:1234', 'http://localhost:4550'];
// //let allowedOrigins = '*';

// app.use(cors({
//   origin: (origin, callback) => {
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
//       let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
//       return callback(new Error(message ), false);
//     }
//     return callback(null, true);
//   }
// }));

// mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// // mongoose.connect('mongodb://localhost:27017/practicedb', { useNewUrlParser: true, useUnifiedTopology: true });


// // Get home page
// app.get('/', (req, res) => {
// 	res.send('Welcome to fastFlix!');
// });

// //Add a user
// /* We’ll expect JSON in this format
// {
//   ID: Integer,
//   Username: String,
//   Password: String,
//   Email: String,
//   Birthday: Date
// }*/


// app.post('/users',
//   // Validation logic here for request
//   //you can either use a chain of methods like .not().isEmpty()
//   //which means "opposite of isEmpty" in plain english "is not empty"
//   //or use .isLength({min: 5}) which means
//   //minimum value of 5 characters are only allowed
//   [
//     check('Username', 'Username is required').isLength({min: 5}),
//     check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
//     check('Password', 'Password is required').not().isEmpty(),
//     check('Email', 'Email does not appear to be valid').isEmail()
//   ], (req, res) => {

//   // check the validation object for errors
//     let errors = validationResult(req);

//     if (!errors.isEmpty()) {
//       return res.status(422).json({ errors: errors.array() });
//     }

//     let hashedPassword = Users.hashPassword(req.body.Password);
//     Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
//       .then((user) => {
//         if (user) {
//           //If the user is found, send a response that it already exists
//           return res.status(400).send(req.body.Username + ' already exists');
//         } else {
//           Users
//             .create({
//               Username: req.body.Username,
//               Password: hashedPassword,
//               Email: req.body.Email,
//               Birthday: req.body.Birthday
//             })
//             .then((user) => { res.status(201).json(user) })
//             .catch((error) => {
//               console.error(error);
//               res.status(500).send('Error: ' + error);
//             });
//         }
//       })
//       .catch((error) => {
//         console.error(error);
//         res.status(500).send('Error: ' + error);
//       });
//   });

// // Get all users
// app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.find()
//     .then((users) => {
//       res.status(201).json(users);
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send('Error: ' + err);
//     });
// });

// // Get a user by username
// app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.findOne({ Username: req.params.Username })
//     .then((user) => {
//       res.json(user);
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send('Error: ' + err);
//     });
// });

// // Update a user's info, by username
// /* We’ll expect JSON in this format
// {
//   Username: String,
//   (required)
//   Password: String,
//   (required)
//   Email: String,
//   (required)
//   Birthday: Date
// }*/
// app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
//     {
//       Username: req.body.Username,
//       Password: req.body.Password,
//       Email: req.body.Email,
//       Birthday: req.body.Birthday
//     }
//   },
//   { new: true }, // This line makes sure that the updated document is returned
//   (err, updatedUser) => {
//     if(err) {
//       console.error(err);
//       res.status(500).send('Error: ' + err);
//     } else {
//       res.json(updatedUser);
//     }
//   });
// });

// // Add a movie to a user's list of favorites
// app.post('/users/:Username/Movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.findOneAndUpdate({ Username: req.params.Username }, {
//      $push: { FavoriteMovies: req.params.MovieID }
//    },
//    { new: true }, // This line makes sure that the updated document is returned
//   (err, updatedUser) => {
//     if (err) {
//       console.error(err);
//       res.status(500).send('Error: ' + err);
//     } else {
//       res.json(updatedUser);
//     }
//   });
// });

// // Delete a user by username
// app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Users.findOneAndRemove({ Username: req.params.Username })
//     .then((user) => {
//       if (!user) {
//         res.status(400).send(req.params.Username + ' was not found');
//       } else {
//         res.status(200).send(req.params.Username + ' was deleted.');
//       }
//     })
//     .catch((err) => {
//       console.error(err);
//       res.status(500).send('Error: ' + err);
//     });
// });

// // Delete a movie from user's favorites
// app.delete('/users/:Username/favorites/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
// 	Users.findOneAndUpdate({ Username: req.params.Username }, {
// 		$pull: { FavoriteMovies: req.params.MovieID }
// 	},
// 	{ new: true }, // Returns the updated document
// 	(err, updatedUser) => {
// 		if (err) {
// 			console.error(err);
// 			res.status(500).send('Error: ' + err);
// 		} else {
// 			res.json(updatedUser);
// 		}
// 	});
// });


// // GET movies
// app.get('/movies', (req, res) => {
//   Movies.find()
//     .then((movies) => {
//       res.status(201).json(movies);
//     })
//     .catch((error) => {
//       console.error(error);
//       res.status(500).send('Error: ' + error);
//     });
// });

// // Get a movie by title
// app.get('/movies/:Title', (req, res) => {
// 	Movies.findOne({ Title: req.params.Title})
// 	.then((movie) => {
// 		res.status(201).json(movie);
// 	})
// 	.catch((err) => {
// 		console.err(err);
// 		res.status(500).send('Error: ' + err);
// 	});
// });

// // Get a genre by title
// app.get('/movies/genres/:Title', (req, res) => {
// 	Movies.findOne({ Title: req.params.Title})
// 	.then((movie) => {
// 		res.status(201).json(movie.Genre.Name + ": " + movie.Genre.Description);
// 	})
// 	.catch((err) => {
// 		console.error(err);
// 		res.status(500).send('Error: ' + err);
// 	});
// });

// // Get a director by name
// app.get('/movies/directors/:Name', (req, res) => {
// 	Movies.findOne({ "Director.Name": req.params.Name})
// 	.then((movie) => {
// 		res.status(201).json(movie.Director.Name + ": " + movie.Director.Bio);
// 	})
// 	.catch((err) => {
// 		console.error(err);
// 		res.status(500).send('Error: ' + err);
// 	});
// });



// // listen for requests
// const port = process.env.PORT || 8080;
// app.listen(port, '0.0.0.0',() => {
//  console.log('Listening on Port ' + port);
// });
