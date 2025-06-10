import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { UserAuth } from "../../context/AuthContext";
import { Link } from "react-router";
import type { Recipe } from "../../types/types";

const MyRecipes = () => {
  const { session } = UserAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recipes:", error);
      } else {
        setRecipes(data);
      }

      setLoading(false);
    };

    fetchRecipes();
  }, [session]);

  if (!session) {
    return (
      <p className="text-center mt-6">Please sign in to view your recipes.</p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Recipes</h1>

      {loading ? (
        <p>Loading recipes...</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-600">You haven’t added any recipes yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <Link
              to={`/recipe/${recipe.slug}`}
              key={recipe.id}
              className="block bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold">{recipe.title}</h2>
                {recipe.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRecipes;
