import { IconType } from "react-icons/lib";
import type { ReactNode } from "react";

export function IconBtn({
  Icon,
  isActive,
  color,
  children,
  onClick,
  ...props
}: {
  isActive?: boolean;
  color?: string;
  Icon: IconType;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => {
        if (onClick) onClick();
      }}
      className={`flex px-0 bg-transparent items-center ${
        isActive ? "icon-btn-active" : ""
      } ${color || ""}`}
      {...props}
    >
      <span className={`${children != null ? "mr-0.5" : ""}`}>
        <Icon />
      </span>
      {children}
    </button>
  );
}
