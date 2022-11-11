import React from "react";
import "./index.css";
import App from "./App";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PostProvider } from "./context/PostContext";

import Home from "./routes/Home";
import Login from "./routes/Login";
import Register from "./routes/Register";
import Post from "./routes/Post";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="/posts/:slug"
          element={
            <PostProvider>
              <Post />
            </PostProvider>
          }
        />
      </Route>
      <Route path="*" element={<h1>Not found</h1>} />
    </Routes>
  </BrowserRouter>
);
