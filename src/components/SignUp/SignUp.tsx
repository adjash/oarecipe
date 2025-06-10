import { useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { registerNewUser } = UserAuth();
  const navigate = useNavigate();

  // const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");

  //   const { data, error } = await registerNewUser(email, password);
  //   if (error) {
  //     setError(error.message);
  //   } else if (data?.user) {
  //     console.log("User signed up:", data.user);
  //     navigate("/");
  //   }

  //   setLoading(false);
  // };
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await registerNewUser(email, password);

    if (!result.success) {
      setError(result.error.message);
    } else if (result.user) {
      console.log("User signed up:", result.user);
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          name="emailfield"
          id="emailfield"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          name="passwordfield"
          id="passwordfield"
          placeholder="password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        {error && <p>{error}</p>}
        <Link to="/signin">Already have an account? Sign in!</Link>
      </form>
    </>
  );
};

export default SignUp;
