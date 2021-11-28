const express = require("express");
const {
  register,
  getPosts,
  getPostsById,
  deletePost,
  addPost,
  updatePost,
} = require("../controller/user");
const routes = express.Router();

routes.post("/register", register);
routes.get("/posts", getPosts);
routes.get("/posts/:id", getPostsById);
routes.post("/add-post", addPost);
routes.put("/update-post/:id", updatePost);
routes.delete("/delete-post/:id", deletePost);

module.exports = routes;
