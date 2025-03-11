const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy=require("passport-google-oauth20").Strategy;
require("dotenv").config();

const app= express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(express.json());
const session = require("express-session");

app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  }));
app.use(passport.initialize());
app.use(passport.session());
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "library",  // Your database name
    password: process.env.DB_PASSWORD,
    port: 5432, // Default PostgreSQL port
  });



  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,


    },
    
    async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await pool.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);
  
          if (user.rows.length === 0) {
            user = await pool.query(
              "INSERT INTO users (google_id, name, email) VALUES ($1, $2, $3) RETURNING *",
              [profile.id, profile.displayName, profile.emails[0].value]
            );
          }
  
          return done(null, user.rows[0]);
        } catch (error) {
          return done(error, null);
        }
      }
    ));

      
      
      passport.serializeUser(function(user, done) {
        done(null, user);
      });
      
      passport.deserializeUser(function(user, done) {
        done(null, user);
      }),
   



  
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
  );
  app.get("/user", (req, res) => {
    if (req.user) {
      res.json(req.user); // Send user details if logged in
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  
  // Logout
  app.get("/logout", (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      req.session.destroy(() => {
        req.user=null;
        res.status(200).json({ message: "Logged out" }); // Send JSON instead of redirecting
      });
    });
  });
  app.get(
    "/google/callback",
    passport.authenticate("google", {
      successRedirect: "http://localhost:3000",
      failureRedirect: "/auth/google/failure",
    })
  );
  app.get("/api/books", async (req, res) => {
    const { user_id } = req.query; // Get user_id from request query

    try {
      const result = await pool.query("SELECT * FROM books WHERE user_id = $1", [user_id]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  });

  app.post("/api/books", async (req, res) => {
    const { user_id, title, category, year, author } = req.body;
  
    try {
      const result = await pool.query(
        "INSERT INTO books (user_id, title, category, year, author) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [user_id, title, category, year, author]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding book");
    }
  });

  app.post("/api/like", async (req, res) => {
    const { user_id, book_id } = req.body;
  
    try {
      await pool.query(
        "INSERT INTO liked_books (user_id, book_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [user_id, book_id]
      );
      res.status(200).json({ message: "Book liked!" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error liking book");
    }
  });
  app.get("/api/liked-books/:user_id", async (req, res) => {
    const { user_id } = req.params;
  
    try {
      const result = await pool.query(
        `SELECT books.* FROM books
        JOIN liked_books ON books.id = liked_books.book_id
        WHERE liked_books.user_id = $1`,
        [user_id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching liked books");
    }
  });

  app.delete("/api/unlike", async (req, res) => {
    const { user_id, book_id } = req.body;
  
    try {
      await pool.query(
        "DELETE FROM liked_books WHERE user_id = $1 AND book_id = $2",
        [user_id, book_id]
      );
      res.status(200).json({ message: "Book unliked!" });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error unliking book");
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    const user_id = req.query.user_id; // Get user_id from query parameters


  const bookId = req.params.id;
  try {
    // Check if the book belongs to the user
    const checkBook = await pool.query(
      "SELECT * FROM books WHERE id = $1 AND user_id = $2",
      [bookId, user_id]
    );
    if (checkBook.rows.length === 0) {
      return res.status(403).json({ message: "Unauthorized to delete this book" });
    }
    // First, remove from liked_books
    await pool.query("DELETE FROM liked_books WHERE book_id = $1", [bookId]);

    // Then, remove from books table
    await pool.query("DELETE FROM books WHERE id = $1", [bookId]);

    res.status(200).json({ message: "Book deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting book");
  }
  });

  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));