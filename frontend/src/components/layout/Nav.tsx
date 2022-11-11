import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function Nav() {
  const { logout, user } = useAuth();

  return (
    <nav className="w-full bg-slate-600 min-h-nav">
      <div className="mx-auto h-full container flex items-center justify-between px-1.5">
        <div className="flex text-white gap-5">
          <Link to="/" aria-label="Home" className="text-lg font-bold">
            Home
          </Link>
          <Link to="/login" aria-label="Login" className="text-lg font-bold">
            Login
          </Link>
          <Link
            to="/register"
            aria-label="Register"
            className="text-lg font-bold"
          >
            Register
          </Link>
          {user && (
            <button
              className="text-lg font-bold px-0 bg-transparent"
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
