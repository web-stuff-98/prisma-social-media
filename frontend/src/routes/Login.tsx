import { useFormik } from "formik";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: (values) => login(values.username, values.password),
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="flex flex-col items-center justify-center gap-2 p-2 text-center"
    >
      <label htmlFor="username">Username</label>
      <input
        value={formik.values.username}
        onChange={formik.handleChange}
        name="username"
        id="username"
        type="text"
        required
      />
      <label htmlFor="password">Password</label>
      <input
        value={formik.values.password}
        onChange={formik.handleChange}
        name="password"
        id="password"
        type="text"
        required
      />
      <button className="w-full mt-2 py-1">Login</button>
    </form>
  );
}
