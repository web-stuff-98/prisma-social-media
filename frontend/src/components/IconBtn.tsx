import { IconType } from "react-icons/lib";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function IconBtn({
  Icon,
  isActive,
  color,
  children,
  onClick,
  redirectToLogin = false,
  ...props
}: {
  isActive?: boolean;
  color?: string;
  Icon: IconType;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  redirectToLogin?: boolean;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        if (redirectToLogin && !user) navigate("/login");
        if (onClick) onClick();
      }}
      className={`flex px-0 bg-transparent relative items-center ${
        isActive ? "icon-btn-active" : ""
      } ${color || ""}`}
      {...props}
    >
      <span className={`${children != null ? "mr-0.5" : ""}`}>
        <Icon className={color?.includes("text") ? color : ""} />
      </span>
      {children}
    </button>
  );
}
