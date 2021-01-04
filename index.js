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

app.get("/", (req, res) => {
  res.send("Welcome to myFlix!");
});

app.get("/movies", (req, res) => {
  res.json(topTenMovies);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(8080, () => console.log("Your app is listening on port 8080."));
