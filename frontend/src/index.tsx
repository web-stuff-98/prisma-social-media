import "./index.css";
import App from "./App";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PostProvider } from "./context/PostContext";

import Home from "./routes/Home";
import Blog from "./routes/Blog";
import Login from "./routes/Login";
import Register from "./routes/Register";
import Post from "./routes/Post";
import Editor from "./routes/Editor";
import Settings from "./routes/Settings";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Home />} />
        <Route path="blog/:page" element={<Blog />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="posts/:slug"
          element={
            <PostProvider>
              <Post />
            </PostProvider>
          }
        />
        <Route path="editor/:slug" element={<Editor />} />
        <Route path="editor" element={<Editor />} />
        <Route path="*" element={<h1>Not found</h1>} />
      </Route>
    </Routes>
  </BrowserRouter>
);
