import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { Link, useParams } from "react-router";
import { UserAuth } from "../../context/AuthContext";
import type { Ingredient, Recipe } from "../../types/types";

const RecipePage = () => {
  const { slug } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { session } = UserAuth();

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) {
        console.error("Error fetching recipe:", error);
        setLoading(false);
        return;
      }

      setRecipe(data);

      const { data: ingData, error: ingError } = await supabase
        .from("ingredients")
        .select("*")
        .eq("recipe_id", data.id);

      if (ingError) {
        console.error("Error fetching ingredients:", ingError);
      } else {
        setIngredients(ingData);
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [slug]);

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);
    setScale(isNaN(newScale) ? 1 : newScale);
  };

  if (loading) return <p className="text-center mt-6">Loading recipe...</p>;
  if (!recipe) return <p className="text-center mt-6">Recipe not found.</p>;

  return (
    <div className="relative">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        {sidebarOpen ? "Close Tools" : "Scale Recipe"}
      </button>

      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg p-6 transition-transform z-40 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">Scale Recipe</h2>
        <label className="block mb-2 font-medium">Scale factor</label>
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={scale}
          onChange={handleScaleChange}
          className="w-full border border-gray-300 p-2 rounded-md mb-4"
        />
        <button
          onClick={() => setScale(1)}
          className="text-blue-600 hover:underline text-sm"
        >
          Reset to 1×
        </button>
      </aside>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{recipe.title}</h1>
        {session?.user?.id === recipe.user_id && (
          <Link
            to={`/edit-recipe/${recipe.slug}`}
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            ✏️ Edit Recipe
          </Link>
        )}

        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full max-h-96 object-cover rounded-md mb-6"
          />
        )}

        {recipe.description && (
          <p className="mb-4 text-gray-700">{recipe.description}</p>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
          <ul className="space-y-2">
            {ingredients.map((ing) => (
              <li key={ing.id} className="text-gray-800">
                {parseFloat(ing.quantity.toString()) * scale} {ing.unit}{" "}
                {ing.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Nutrition Information</h2>
          <div className="bg-gray-50 p-4 rounded-md border space-y-1">
            <div className="flex justify-between">
              <span>Calories:</span>
              <span>
                {Math.round((recipe.total_calories ?? 0) * scale)} kcal
              </span>
            </div>
            <div className="flex justify-between">
              <span>Protein:</span>
              <span>{((recipe.total_protein ?? 0) * scale).toFixed(1)} g</span>
            </div>
            <div className="flex justify-between">
              <span>Fat:</span>
              <span>{((recipe.total_fat ?? 0) * scale).toFixed(1)} g</span>
            </div>
            <div className="flex justify-between">
              <span>Carbohydrates:</span>
              <span>{((recipe.total_carbs ?? 0) * scale).toFixed(1)} g</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            Based on a scale of ×{scale}
          </p>
        </div>

        {recipe.servings && (
          <div className="bg-gray-50 p-4 rounded-md border mt-4">
            <h3 className="font-semibold mb-2">Per Serving (×{scale})</h3>
            <div className="flex justify-between">
              <span>Calories:</span>
              <span>
                {Math.round(
                  ((recipe.total_calories ?? 0) * scale) / recipe.servings
                )}{" "}
                kcal
              </span>
            </div>
            <div className="flex justify-between">
              <span>Protein:</span>
              <span>
                {(
                  ((recipe.total_protein ?? 0) * scale) /
                  recipe.servings
                ).toFixed(1)}{" "}
                g
              </span>
            </div>
            <div className="flex justify-between">
              <span>Fat:</span>
              <span>
                {(((recipe.total_fat ?? 0) * scale) / recipe.servings).toFixed(
                  1
                )}{" "}
                g
              </span>
            </div>
            <div className="flex justify-between">
              <span>Carbohydrates:</span>
              <span>
                {(
                  ((recipe.total_carbs ?? 0) * scale) /
                  recipe.servings
                ).toFixed(1)}{" "}
                g
              </span>
            </div>
          </div>
        )}

        {recipe.notes && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Notes</h2>
            <p className="text-gray-700 whitespace-pre-line">{recipe.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipePage;
