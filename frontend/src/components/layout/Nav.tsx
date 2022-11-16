import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import useUsers from "../../context/UsersContext";

export default function Nav() {
  const { logout, user } = useAuth();

  const { visibleUsers, disappearedUsers } = useUsers();

  return (
    <nav className="w-full bg-slate-600 min-h-nav">
      <div className="mx-auto h-full container flex items-center justify-between px-1.5">
        <div className="flex text-white gap-5">
          <Link to="/" aria-label="Home" className="text-md font-bold">
            Home
          </Link>
          {user && (
            <Link
              to="/settings"
              aria-label="Settings"
              className="text-md font-bold"
            >
              Settings
            </Link>
          )}
          {!user && (
            <>
              <Link
                to="/login"
                aria-label="Login"
                className="text-md font-bold"
              >
                Login
              </Link>
              <Link
                to="/register"
                aria-label="Register"
                className="text-md font-bold"
              >
                Register
              </Link>
            </>
          )}
                    {user && (
            <Link
              to="/editor"
              aria-label="Editor"
              className="text-md font-bold"
            >
              Editor
            </Link>
          )}
             
          {user && (
            <button
              className="text-md font-bold px-0 bg-transparent"
              onClick={() => logout()}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
