import { useCallback, useEffect, useState } from "react";

//https://usehooks.com/useAsync/

const useAsync = (asyncFunction: Function, immediate = true) => {
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(() => {
    setStatus("pending");
    setValue(null);
    setError(null);

    return asyncFunction()
      .then((response:any) => {
        setValue(response);
        setStatus("success");
      })
      .catch((error:any) => {
        setError(error);
        setStatus("error");
      });
  }, [asyncFunction]);

  // Call execute if we want to fire it right away.
  // Otherwise execute can be called later, such as
  // in an onClick handler.
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
};

export default useAsync;
