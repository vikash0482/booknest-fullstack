import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

db.connect();


// HOME PAGE
app.get("/", async (req, res) => {
  const search = req.query.search || "";
  const sort = req.query.sort || "id DESC";

  let orderBy = "id DESC";

  if (sort === "title") orderBy = "title ASC";
  if (sort === "rating") orderBy = "rating DESC";
  if (sort === "latest") orderBy = "date_read DESC";

  try {
    const result = await db.query(
      `SELECT * FROM books
       WHERE title ILIKE $1
       ORDER BY ${orderBy}`,
      [`%${search}%`]
    );

    const totalBooks = result.rows.length;

    res.render("index", {
      books: result.rows,
      totalBooks,
      search,
      sort
    });

  } catch (err) {
    console.log(err);
    res.send("Database error");
  }
});


// ADD PAGE
app.get("/add", (req, res) => {
  res.render("add");
});


// SAVE BOOK
app.post("/add", async (req, res) => {
  const { title, author, isbn, rating, review, date_read } = req.body;

  try {
    await db.query(
      "INSERT INTO books (title, author, isbn, rating, review, date_read) VALUES ($1,$2,$3,$4,$5,$6)",
      [title, author, isbn, rating, review, date_read]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Error adding book");
  }
});

// EDIT PAGE
app.get("/edit/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE id=$1", [id]);
    res.render("edit", { book: result.rows[0] });
  } catch (err) {
    console.log(err);
    res.send("Error loading edit page");
  }
});


// UPDATE BOOK
app.post("/edit/:id", async (req, res) => {
  const id = req.params.id;
  const { title, author, isbn, rating, review, date_read } = req.body;

  try {
    await db.query(
      "UPDATE books SET title=$1, author=$2, isbn=$3, rating=$4, review=$5, date_read=$6 WHERE id=$7",
      [title, author, isbn, rating, review, date_read, id]
    );

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Update failed");
  }
});


// DELETE BOOK
app.get("/delete/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await db.query("DELETE FROM books WHERE id=$1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Delete failed");
  }
});


// SERVER
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});