import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import resolveConfig from "tailwindcss/resolveConfig";
import throttle from "lodash/throttle";

//https://gist.github.com/SimeonGriggs/7071958b8a629faf9137734aec713a0c#file-usetailwindbreakpoint-js
// ^ copied this hook and merged into file, it needed adjustments to work with typescript and tailwindconfig being outside src directory

//this shouldn't be "defaultConfig", it should be tailwind.config.js, but i cannot import that because it's outside of the src directory
//need to fix this somehow
import tailwindConfig from "tailwindcss/defaultConfig";

type Breakpoint = "sm" | "md" | "lg" | "xl";
interface State {
  breakPoint: Breakpoint;
  darkMode: boolean;
}

const InterfaceContext = createContext<{
  state: State;
  dispatch: (action: Partial<State>) => void;
}>({
  state: {
    breakPoint: "md",
    darkMode: true,
  },
  dispatch: () => {},
});

const interfaceReducer = (state: State, action: Partial<State>) => ({
  ...state,
  ...action,
});

const initialState: State = {
  breakPoint: "md",
  darkMode: false,
};

const InterfaceProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(interfaceReducer, initialState);

  const width = typeof window !== "undefined" ? window.innerWidth : 0;

  useEffect(() => {
    const calcInnerWidth = throttle(() => {
      dispatch({ breakPoint: getDeviceConfig(width) });
    }, 500);
    window.addEventListener("resize", calcInnerWidth);
    return () => window.removeEventListener("resize", calcInnerWidth);
  }, []);

  return (
    <InterfaceContext.Provider value={{ state, dispatch }}>
      {children}
    </InterfaceContext.Provider>
  );
};

const useInterface = () => useContext(InterfaceContext);

export { useInterface, InterfaceProvider };

const findKeyByValue = (object: any, value: string) =>
  Object.keys(object).find((key: string) => object[key] === value);

function getDeviceConfig(width: number): Breakpoint {
  const fullConfig = resolveConfig(tailwindConfig);
  //@ts-ignore fing ignore this... confusing typescript errors. doesn't matter either.
  const { screens } = fullConfig.theme;

  const bpSizes = Object.keys(screens).map((screenSize) =>
    parseInt(screens[screenSize as keyof typeof screens])
  );

  const bpShapes = bpSizes.map((size, index) => ({
    min: !index ? 0 : bpSizes[index - 1],
    max: size,
    key: findKeyByValue(screens, `${size}px`),
  }));

  let breakpoint = null;

  bpShapes.forEach((shape) => {
    if (!shape.min && width < shape.max) {
      breakpoint = shape.key;
    } else if (width >= shape.min && width < shape.max) {
      breakpoint = shape.key;
    } else if (!shape.max && width >= shape.max) {
      breakpoint = shape.key;
    }
  });

  return breakpoint || "md";
}
