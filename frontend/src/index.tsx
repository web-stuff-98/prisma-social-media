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
import Profile from "./routes/Profile";
import NotFound from "./routes/NotFound";

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
        <Route path="profile/:id" element={<Profile />} />
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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
