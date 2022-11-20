import axios, { AxiosError, AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
});

export function makeRequest(url: string, options?: AxiosRequestConfig) {
  return api(url, options)
    .then((res) => res.data)
    .catch((error) =>
      Promise.reject(
        (error.response?.data.msg ?? "Error").replace("Error: ", "")
      )
    );
}
