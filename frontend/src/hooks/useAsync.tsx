import { useCallback, useEffect, useState } from "react";

//https://usehooks.com/useAsync/

const useAsync = (asyncFunction: Function, immediate = true) => {
  const [status, setStatus] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(() => {
    setStatus("pending");
    setValue(null);
    setError(null);

    return asyncFunction()
      .then((response: any) => {
        setValue(response);
        setStatus("success");
      })
      .catch((error: any) => {
        setError(error);
        setStatus("error");
      });
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error };
};

export default useAsync;
