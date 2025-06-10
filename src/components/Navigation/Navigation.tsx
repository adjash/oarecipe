import { Link } from "react-router";
import { UserAuth } from "../../context/AuthContext";

const Navigation = () => {
  const { session, signOut } = UserAuth();

  const handleSignOut = async () => {
    return await signOut();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-xl font-bold text-gray-800 hover:text-blue-600"
        >
          RecipeApp
        </Link>
        <div className="space-x-4">
          {session ? (
            <>
              <Link
                to="/new-recipe"
                className="text-gray-700 hover:text-blue-500 transition"
              >
                New Recipe
              </Link>
              <Link
                to="/my-recipes"
                className="text-gray-700 hover:text-blue-500 transition"
              >
                My Recipes
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-500 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="text-gray-700 hover:text-blue-500 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-gray-700 hover:text-blue-500 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
