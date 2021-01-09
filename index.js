const express = require("express");
const app = express();
const morgan = require("morgan");

app.use(morgan("common"));

app.use(express.static("public"));

let topTenMovies = [
  {
    title: "Veer Zara",
    cast: "Shahrukh khan, Preeti Zinta"
  },
  {
    title: "3 Ediots",
    cast: "Amir Khan, Kareena Kapoor"
  },
  {
    title: "Kaagaz",
    cast: "Pankaj Tripathi,Monal Gajjar,Amar Upadhyay"
  },
  {
    title: "Tribhanga",
    cast: "Kajol,Tanvi Azmi,Mithila Palkar,Kunaal Roy Kapur"
  },
  {
    title: "Haathi Mere Saathi",
    cast: "Rana Daggubati,Vishnu Vishal,Pulkit Samrat,Zoya Hussain"
  },
  {
    title: "Atrangi Re",
    cast: "Akshay Kumar,Dhanush,Sara Ali Khan"
  },
  {
    title: "Satyameva Jayate 2",
    cast: "John Abraham,Divya Khosla Kumar"
  },
  {
    title: "Kabhi Eid Kabhi Diwali",
    cast: "Salman Khan,Pooja Hegde"
  },
  {
    title: "Heropanti 2",
    cast: "Tiger Shroff,Tara Sutaria"
  },
  {
    title: "14 Phere",
    cast: "Vikrant Massey,Kriti Kharbanda"
  }
];

// app.get("/movies", (req, res) => {
//   res.json(topTenMovies);
// });
// ---
app.get("/", (req, res) => {
  res.send("Welcome to myFlix!");
});

// Get a list of data about all movies
app.get("/movies", (req, res) => {
  res.send("Successful GET request returning data on all movies");
});

// Get data about a single movie, by title
app.get("/movies/:title", (req, res) => {
  res.send(
    "Successful GET request returning data on movie title: " + req.params.title
  );
});

// Get data about a genre by title
app.get("/movies/genres/:genre", (req, res) => {
  res.send(
    "Successful GET request returning data on genre: " + req.params.genre
  );
});

// Get data about a director by name
app.get("/movies/directors/:name", (req, res) => {
  res.send(
    "Successful GET request returning data on director: " + req.params.name
  );
});

// Post new user registration
app.post("/users", (req, res) => {
  res.send("Successful POST request registering new user");
});

// Put updates to user information
app.put("/users/:username", (req, res) => {
  res.send(
    "Successful PUT request updating information for user: " +
      req.params.username
  );
});

// Post new movie to user list of favorite movies
app.post("/users/:username/movies/:movieID", (req, res) => {
  res.send(
    "Successful POST request adding movie with ID: " +
      req.params.movieID +
      " to favorite movie list of User: " +
      req.params.username
  );
});

// Delete a movie from list of user's favorite movies
app.delete("/users/:username/movies/:movieID", (req, res) => {
  res.send(
    "Successful DELETE request removing movie with ID: " +
      req.params.movieID +
      " from favorite movie list of User: " +
      req.params.username
  );
});

// Deletes a user from registration database
app.delete("/users/:username", (req, res) => {
  res.send(
    "Successful DELETE request removing User: " +
      req.params.username +
      " from database"
  );
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(8080, () => console.log("Your app is listening on port 8080."));
