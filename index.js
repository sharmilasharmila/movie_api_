const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

const express = require("express"),
  morgan = require("morgan");

const app = express();

mongoose.connect("mongodb://localhost:27017/myFlixDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// terminal logger
app.use(morgan("common"));

// static public folder
app.use(express.static("public"));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// get all movies
app.get("/movies", (req, res) => {
  Movies.find()
    .then(movies => {
      res.status(201).json(movies);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// get movies by title
app.get("/movies/:title", (req, res) => {
  Movies.findOne({ Title: req.params.title })
    .then(movies => {
      res.json(movies);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});


app.get('/movies/genres/:Name', (req, res) => {
  // This is how it is searched by - by name of GENRE, not name of MOVIE
      Movies.findOne({ Title: req.params.Name })
  // This is what is returned in JSON format, I only need Genre Name + Genre Description, not entire movie details
      .then((movie) => {
          res.status(201).json(movie.Genre.Name + ": " + movie.Genre.Description);
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
  });

// Return data about a director by their name
app.get("/movies/directors/:name", (req, res) => {
  Movies.findOne({ "Director.Name": req.params.name })
    .then(director => {
      res.json(director.Director);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  username: String,
  password: String,
  email: String,
  birthday: Date
}*/
//Add a new user
app.post('/users', (req, res) => {
  Users.findOne({Username: req.body.Username})
  .then((user) => {
      if(user) {
          return res.status(400).send(req.body.Username + 'already exists');
      } else {
          Users.create({
              Username: req.body.Username,
              Password: req.body.Password,
              Email: req.body.Email,
              Birthday: req.body.Birthday
          })
          .then((user) => {
              res.status(201).json(user)
          })
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



// Get all users
app.get("/users", (req, res) => {
  Users.find()
    .then(users => {
      res.status(201).json(users);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// Get a user by username
app.get("/users/:username", (req, res) => {
  Users.findOne({ Username: req.params.username })
    .then(user => {
      res.json(user);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});


// Update a user's info, by username
/* We’ll expect JSON in this format
{
  username: String,
  (required)
  password: String,
  (required)
  email: String,
  (required)
  birthday: Date
}*/

//allow users to update their user info(username)
app.put('/users/:Username', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username}, { $set:
      {
          Username: req.body.Username,
          Password: req.body.Password,
          Email: req.body.Email,
          Birthday: req.body.Birthday
      }
  },
  { new: true }, //This line makes sure the updated document is returned
  (err, updatedUser) => {
      if(err) {
          console.error(err);
          res.status(500).send('Error: ' + err);
      } else {
          res.json(updatedUser);
      }
  });
});


//allow users to add a movie to their favorite list - EXACT SAME CODE AS REMOVE MOVIE, EXCEPT NEEDS $PULL OPERATOR!
app.post('/users/:Username/FavoriteMovies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ "Username": req.params.Username }, {
      $push: { "FavoriteMovies": req.params.MovieID }
  },
  { new: true },
  (err, updatedUser) => {
      if(err) {
          console.error(err);
          res.status(500).send('Error: ' + error);
      } else {
          res.json(updatedUser);
      }   
  });
});

// Remove a movie from user's list of favorites
app.delete("/users/:username/FavoriteMovies/:movieID", (req, res) => {
  Users.findOneAndUpdate(
    { "Username": req.params.username },
    {
      $pull: { "FavoriteMovies": req.params.movieID }
    },
    { new: true },
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

// Delete a user by username
app.delete("/users/:username", (req, res) => {
  Users.findOneAndRemove({ Username: req.params.username })
    .then(user => {
      if (!user) {
        res.status(400).send(req.params.username + " was not found");
      } else {
        res.status(200).send(req.params.username + " was deleted.");
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

// listen for requests
app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});