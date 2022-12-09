import { useRef, useState } from "react";
import type { ReactNode } from "react";

export type DropdownItem = {
  name: string;
  node: ReactNode;
};

export default function Dropdown({
  items = [
    { name: "A", node: <>A</> },
    { name: "B", node: <>B</> },
    { name: "C", node: <>C</> },
  ],
  index = 0,
  setIndex = () => {},
  noRightBorderRadius,
  noLeftBorderRadius,
  noRightBorder,
  noLeftBorder,
}: {
  items?: DropdownItem[];
  index?: number;
  setIndex?: (to: number) => void;
  noRightBorderRadius?: boolean;
  noLeftBorderRadius?: boolean;
  noRightBorder?: boolean;
  noLeftBorder?: boolean;
}) {
  const rootItemContainerRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const renderItem = (
    name: string,
    children: ReactNode,
    itemIndex: number,
    list?: boolean
  ) => {
    const isStartItem = itemIndex === 0 || !dropdownOpen;
    const isMiddleItem = itemIndex > 0 && itemIndex < items.length - 1;
    const isEndItem = itemIndex === items.length - 1;

    return (
      <button
        key={name}
        type="button"
        style={
          list
            ? {
                position: "absolute",
                top: `${
                  rootItemContainerRef.current?.clientHeight! * itemIndex
                }px`,
                ...(isMiddleItem
                  ? {
                      borderTop: "none",
                      borderBottom: "none",
                      borderRadius: "0",
                      height: `${
                        rootItemContainerRef.current?.clientHeight! + 2
                      }px`,
                    }
                  : {
                      ...(isEndItem
                        ? {
                            borderTop: "none",
                            borderTopLeftRadius: "0",
                            borderTopRightRadius: "0",
                          }
                        : {}),
                    }),
              }
            : {
                ...(dropdownOpen && isStartItem
                  ? {
                      borderBottom: "none",
                      borderBottomLeftRadius: "0",
                      borderBottomRightRadius: "0",
                    }
                  : {}),
                ...(isStartItem
                  ? {
                      ...(noLeftBorderRadius
                        ? {
                            borderTopLeftRadius: "0",
                            borderBottomLeftRadius: "0",
                          }
                        : {}),
                      ...(noRightBorderRadius
                        ? {
                            borderTopRightRadius: "0",
                            borderBottomRightRadius: "0",
                          }
                        : {}),
                      ...(noLeftBorder
                        ? {
                            borderLeft: "none",
                          }
                        : {}),
                      ...(noRightBorder
                        ? {
                            borderRight: "none",
                          }
                        : {}),
                    }
                  : {}),
              }
        }
        onClick={() => {
          if (!dropdownOpen) {
            setDropdownOpen(true);
          } else {
            setIndex(itemIndex);
            setDropdownOpen(false);
          }
        }}
        aria-label={name}
        className={`w-full ${
          itemIndex === index && dropdownOpen
            ? "bg-foregroundHover dark:bg-darkmodeForegroundHover"
            : "bg-foreground dark:bg-darkmodeForeground"
        } hover:bg-foregroundHover dark:hover:bg-darkmodeForegroundHover text-center flex items-center justify-center font-normal border dark:border-stone-800 px-1 text-xs rounded py-1 dark:text-white`}
      >
        {children}
      </button>
    );
  };

  return (
    <div onMouseLeave={() => setDropdownOpen(false)} className="w-full w-20">
      <div className="relative" ref={rootItemContainerRef}>
        {renderItem(
          items[dropdownOpen ? 0 : index].name,
          items[dropdownOpen ? 0 : index].node,
          dropdownOpen ? 0 : index
        )}
        {dropdownOpen &&
          items
            .slice(1, items.length)
            .map((item, index) =>
              renderItem(item.name, item.node, index + 1, true)
            )}
      </div>
    </div>
  );
}
