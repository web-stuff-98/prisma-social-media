import axios, { AxiosRequestConfig } from "axios";

export const baseURL = "http://localhost:3001"

const api = axios.create({
  baseURL,
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
