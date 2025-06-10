import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInUser(email, password);
      if (result.success) {
        navigate("/my-recipes");
      }
    } catch (err) {
      if (err) setError("an error occured");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <h2>Sign In</h2>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          name="emailfield"
          id="emailfield"
          placeholder="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          name="passwordfield"
          id="passwordfield"
          placeholder="password..."
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          Sign Up
        </button>
        {error && <p>{error}</p>}
        <Link to={"/signup"}>Don't have an account already? Sign up!</Link>
      </form>
    </>
  );
};
export default SignIn;
