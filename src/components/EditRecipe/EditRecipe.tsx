import { useEffect, useState } from "react";
import supabase from "../../utils/supabase";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router";
import type { Ingredient } from "../../types/types";

const EditRecipe = () => {
  const { slug } = useParams();
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data: recipe, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !recipe || recipe.user_id !== session?.user?.id) {
        navigate("/");
        return;
      }

      setTitle(recipe.title);
      setDescription(recipe.description || "");
      setNotes(recipe.notes || "");
      setServings(recipe.servings?.toString() || "");

      const { data: ingredientData } = await supabase
        .from("ingredients")
        .select("*")
        .eq("recipe_id", recipe.id);

      setIngredients(ingredientData || []);
      setLoading(false);
    };

    fetchRecipe();
  }, [slug, session, navigate]);

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: "",
        quantity: 0,
        unit: "",
        calories: 0,
        protein: null,
        fat: null,
        carbs: null,
        recipe_id: 0,
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data: recipe } = await supabase
      .from("recipes")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!recipe) return;

    await supabase
      .from("recipes")
      .update({
        title,
        description,
        notes,
        servings: parseFloat(servings),
      })
      .eq("id", recipe.id);

    await supabase.from("ingredients").delete().eq("recipe_id", recipe.id);

    const ingredientRows = ingredients
      .filter((ing) => ing.name && ing.quantity && ing.unit && ing.calories)
      .map((ing) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: Number(ing.quantity),
        unit: ing.unit,
        calories: Number(ing.calories),
        protein: ing.protein ? Number(ing.protein) : null,
        fat: ing.fat ? Number(ing.fat) : null,
        carbs: ing.carbs ? Number(ing.carbs) : null,
      }));

    if (ingredientRows.length > 0) {
      await supabase.from("ingredients").insert(ingredientRows);

      const totals = ingredientRows.reduce(
        (acc, ing) => {
          acc.calories += ing.calories;
          acc.protein += ing.protein || 0;
          acc.fat += ing.fat || 0;
          acc.carbs += ing.carbs || 0;
          return acc;
        },
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      );

      await supabase
        .from("recipes")
        .update({
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_fat: totals.fat,
          total_carbs: totals.carbs,
        })
        .eq("id", recipe.id);
    }

    setIsSubmitting(false);
    navigate(`/recipe/${slug}`);
  };

  if (loading) return <p className="text-center mt-6">Loading recipe...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h1 className="text-2xl font-bold mb-6">Edit Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border p-2 rounded"
          placeholder="Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Description"
          rows={3}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Notes"
          rows={3}
        />
        <input
          type="number"
          value={servings}
          onChange={(e) => setServings(e.target.value)}
          placeholder="Servings"
          className="w-full border p-2 rounded"
          required
        />

        {ingredients.map((ing, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 mb-4">
            <input
              value={ing.name}
              onChange={(e) =>
                handleIngredientChange(i, "name", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Name"
            />
            <input
              value={ing.quantity}
              onChange={(e) =>
                handleIngredientChange(i, "quantity", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Quantity"
            />
            <input
              value={ing.unit}
              onChange={(e) =>
                handleIngredientChange(i, "unit", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Unit"
            />
            <input
              value={ing.calories}
              onChange={(e) =>
                handleIngredientChange(i, "calories", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Calories *"
              required
            />
            <input
              value={ing.protein ?? ""}
              onChange={(e) =>
                handleIngredientChange(i, "protein", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Protein (g)"
            />
            <input
              value={ing.fat ?? ""}
              onChange={(e) => handleIngredientChange(i, "fat", e.target.value)}
              className="border p-2 rounded"
              placeholder="Fat (g)"
            />
            <input
              value={ing.carbs ?? ""}
              onChange={(e) =>
                handleIngredientChange(i, "carbs", e.target.value)
              }
              className="border p-2 rounded"
              placeholder="Carbs (g)"
            />
            <button
              type="button"
              onClick={() => removeIngredient(i)}
              className="text-red-500 text-sm"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addIngredient}
          className="text-blue-600 hover:underline"
        >
          + Add Ingredient
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {isSubmitting ? "Updating..." : "Update Recipe"}
        </button>
      </form>
    </div>
  );
};

export default EditRecipe;
