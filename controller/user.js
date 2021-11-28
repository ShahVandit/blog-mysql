const mysql = require("mysql");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();
const bodyParser = require("body-parser");
const db = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.dbname,
});

//===== Registering new user =======
exports.register = (req, res) => {
  const author = req.body.author;
  const email = req.body.email;
  const password = req.body.password;
  const id = req.body.id;
  const testMail =
    /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  if (!password || !email || !author || !id) {
    res.status(400).json({ err: "Enter all fields" });
  }

  if (!testMail.test(email)) {
    res.status(400).json({ err: "Enter valid email" });
  }
  // validations passed
  else {
    // Author ID is unique
    const findId = "select author_id from users1 where author_id='" + id + "'";
    const x = db.query(findId, (err, result1) => {
      if (err) res.status(400).json({ err });
      else {
        if (result1.length != 0) {
          res.status(400).json({ error: "ID already taken" });
        } else {
          // Email ID is unique
          const findEmail =
            "select email from users1 where email='" + email + "'";
          db.query(findEmail, (err, result) => {
            if (err) {
              res.status(400).json({ err });
            } else {
              if (result.length != 0) {
                res.status(400).json({ error: "Email already taken" });
              } else {
                // Hashing the password
                bcrypt.genSalt(10, (err, salt) => {
                  bcrypt.hash(password, salt, (err, hash) => {
                    if (err) {
                      res.json({ error: err });
                    } else {
                      var hashpassword = hash;
                      // Storing into the database
                      let query =
                        "insert into users1(author,email,password,author_id) values('" +
                        author +
                        "','" +
                        email +
                        "','" +
                        hashpassword +
                        "','" +
                        id +
                        "')";
                      db.query(query, (err, result) => {
                        if (err) {
                          res.status(400).json({ err });
                        } else {
                          res.status(200).json({ result });
                        }
                      });
                    }
                  });
                });
              }
            }
          });
        }
      }
    });
  }
};

// View all posts
exports.getPosts = (req, res) => {
  let query = "select * from posts";
  db.query(query, (err, rows, result) => {
    if (err) {
      res.status(400).json({ err });
    } else {
      if (result.length == 0) {
        res.status(404).json({ message: "No posts availble" });
      } else {
        res.status(200).json({ rows });
      }
    }
  });
};

// View posts by author ID
exports.getPostsById = (req, res) => {
  const id = req.params.id;
  let query = "select * from posts where author_id='" + id + "'";
  db.query(query, (err, rows, result) => {
    if (err) {
      res.status(400).json({ err });
    } else {
      if (rows.length == 0) {
        res.status(404).json({ message: "This post does not exist" });
      } else {
        res.status(200).json({ rows });
      }
    }
  });
};

// =======Adding a new post=======
exports.addPost = (req, res) => {
  const id = req.body.id;
  const description = req.body.description;
  const title = req.body.title;
  if (!title || !description || !id) {
    res.status(400).json({ error: "Enter all fields" });
  }
  // Checking if the user is registered
  let query = "select * from users1 where author_id='" + id + "'";
  db.query(query, (err, row1, result) => {
    if (err) res.status(400).json(err);
    else {
      if (row1.length != 0) {
        const author = row1[0].author;
        let query =
          "insert into posts(author_id,title,description,author) values('" +
          id +
          "','" +
          title +
          "','" +
          description +
          "','" +
          author +
          "')";
        db.query(query, (err, row, result) => {
          if (err) {
            res.status(400).json({ err });
          } else {
            // Mailing the new post to all Users
            let allMails = "select email from users1";
            // post id is the auto-incrementing PK so it will be the same as the insertId
            const post_id = row.insertId;
            let query = "select * from posts where post_id='" + post_id + "'";
            db.query(query, (err, rows, result) => {
              db.query(allMails, (err, emails, result) => {
                if (emails.length != 0) {
                  emails.forEach((mail) => {
                    // Not sending the mail to the user who has made the blog
                    if (mail.email != row1[0].email) {
                      const transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                          user: "<Sender's email>",
                          pass: "<Sender's password>",
                        },
                      });
                      const options = {
                        from: "<Senders email>",
                        to: mail.email, //Receivers email
                        subject: "Blog Post App || New Post created",
                        text: `Post ID:${post_id}
                        Author: ${rows[0].author}
                        Title: ${rows[0].title}
                        Description:${rows[0].description}`,
                      };
                      transporter.sendMail(options, (err2, info) => {
                        if (!info) {
                          res.status(400).json({ err2 });
                        } else {
                          console.log("info ", info);
                        }
                      });
                    }
                  });
                }
              });

              res.status(200).json({ rows });
            });
          }
        });
      } else {
        res.status(200).json({ response: "Please register first" });
      }
    }
  });
};

// =======deleting the post========
exports.deletePost = (req, res) => {
  const id = req.params.id;
  let query = "delete from posts where post_id='" + id + "'";
  db.query(query, (err, rows, result) => {
    if (err) {
      res.status(400).json({ err });
    } else {
      if (rows.length == 0) {
        res.status(404).json({ message: "No post with this ID availble" });
      } else {
        res.status(200).json({ rows });
      }
    }
  });
};

// =======updating the post ==========
exports.updatePost = (req, res) => {
  const post_id = req.params.id;
  const description = req.body.description;
  const title = req.body.title;
  if (!title || !description) {
    res.status(400).json({ error: "Enter all fields" });
  }
  let findId = "select * from posts where post_id='" + post_id + "'";
  db.query(findId, (err, row, result) => {
    if (err) {
      res.status(400).json({ err });
    } else {
      if (row.length == 0) {
        res.status(400).json({ message: "id doesnt exist" });
      }
    }
  });

  let updateQuery =
    "update posts set title='" +
    title +
    "',description='" +
    description +
    "' where post_id =" +
    post_id;

  db.query(updateQuery, (err, result) => {
    if (!result) {
      res.status(400).json({ err });
    } else {
      if (result.length == 0) {
        res.status(400).json({ message: "id doesnt exist" });
      } else {
        res.status(200).json({ result });
      }
    }
  });
};
