import { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";

type Breakpoint = "sm" | "md" | "xl" | "xxl";
interface State {
  breakPoint: Breakpoint;
  darkMode: boolean;
  mobileMenuOpen: boolean;
  maxOpenCommentsInThread: number;
}

/*
Make sure theres are the same as the breakpoints in the tailwind config
*/
const breakPoints = {
  sm: 512,
  md: 570,
  xl: 680,
  xxl: 768,
};

const InterfaceContext = createContext<{
  state: State;
  dispatch: (action: Partial<State>) => void;
}>({
  state: {
    breakPoint: "xl",
    darkMode: true,
    mobileMenuOpen: false,
    maxOpenCommentsInThread: 4
  },
  dispatch: () => {},
});

const interfaceReducer = (state: State, action: Partial<State>) => ({
  ...state,
  ...action,
});

const initialState: State = {
  breakPoint: "xl",
  darkMode: false,
  mobileMenuOpen: false,
  maxOpenCommentsInThread: 4,
};

const InterfaceProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(interfaceReducer, initialState);

  useEffect(() => {
    const getBreakpoint = () => {
      const w = window.innerWidth;
      let breakPoint: Breakpoint = "sm";
      if (w >= breakPoints.md) breakPoint = "md";
      if (w >= breakPoints.xl) breakPoint = "xl";
      if (w >= breakPoints.xxl) breakPoint = "xxl";
      dispatch({
        breakPoint,
        maxOpenCommentsInThread:
          breakPoint === "sm" ? 1 : breakPoint === "md" ? 2 : 3,
      });
    };
    const i = setInterval(() => getBreakpoint(), 500);
    const handleDetectDarkmode = (event: MediaQueryListEvent) =>
      dispatch({ darkMode: event?.matches ? true : false });
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handleDetectDarkmode);
    window.addEventListener("resize", getBreakpoint);
    return () => {
      clearInterval(i);
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handleDetectDarkmode);
      window.removeEventListener("resize", getBreakpoint);
    };
  }, []);

  return (
    <InterfaceContext.Provider value={{ state, dispatch }}>
      {children}
    </InterfaceContext.Provider>
  );
};

const useInterface = () => useContext(InterfaceContext);

export { useInterface, InterfaceProvider };
