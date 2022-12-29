import { Navigate } from "react-router-dom";
import { IUser } from "../context/AuthContext";

export default function ProtectedRoute<ReactNode>({
  user,
  children,
}: {
  user?: IUser;
  children: ReactNode;
}) {
  if (!user) {
    return <Navigate to={"/login"} />;
  } else {
    return children;
  }
}
