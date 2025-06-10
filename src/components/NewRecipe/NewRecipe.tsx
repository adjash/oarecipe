import { useState } from "react";
import supabase from "../../utils/supabase";
import { UserAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";

const NewRecipe = () => {
  const { session } = UserAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState([
    {
      name: "",
      quantity: "",
      unit: "",
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
    },
  ]);
  const [servings, setServings] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleIngredientChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index][field as keyof (typeof updated)[0]] = value;
    setIngredients(updated);
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: "",
        quantity: "",
        unit: "",
        calories: "",
        protein: "",
        fat: "",
        carbs: "",
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImage(e.target.files[0]);
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let imageUrl = null;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(filePath, image);

      if (uploadError) {
        new Error("Image upload failed!");
        setIsSubmitting(false);
        return;
      }

      const { data } = supabase.storage
        .from("recipe-images")
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    const baseSlug = slugify(title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: recipeData, error: insertError } = await supabase
      .from("recipes")
      .insert({
        title,
        description,
        notes,
        image_url: imageUrl,
        user_id: session?.user?.id,
        slug: uniqueSlug,
        servings: parseFloat(servings),
      })
      .select()
      .single();

    if (insertError || !recipeData) {
      new Error("Error saving recipe!");
      setIsSubmitting(false);
      return;
    }

    const ingredientRows = ingredients
      .filter((ing) => ing.name && ing.quantity && ing.unit && ing.calories)
      .map((ing) => ({
        recipe_id: recipeData.id,
        name: ing.name,
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
        calories: parseFloat(ing.calories),
        protein: ing.protein ? parseFloat(ing.protein) : null,
        fat: ing.fat ? parseFloat(ing.fat) : null,
        carbs: ing.carbs ? parseFloat(ing.carbs) : null,
      }));

    if (ingredientRows.length > 0) {
      const { error: ingredientError } = await supabase
        .from("ingredients")
        .insert(ingredientRows);

      if (ingredientError) {
        new Error("Error saving ingredients!");
        setIsSubmitting(false);
        return;
      }

      const totalNutrition = ingredientRows.reduce(
        (totals, ing) => {
          totals.calories += ing.calories || 0;
          totals.protein += ing.protein || 0;
          totals.fat += ing.fat || 0;
          totals.carbs += ing.carbs || 0;
          return totals;
        },
        { calories: 0, protein: 0, fat: 0, carbs: 0 }
      );

      await supabase
        .from("recipes")
        .update({
          total_calories: totalNutrition.calories,
          total_protein: totalNutrition.protein,
          total_fat: totalNutrition.fat,
          total_carbs: totalNutrition.carbs,
        })
        .eq("id", recipeData.id);
    }

    setIsSubmitting(false);
    navigate(`/recipe/${recipeData.slug}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
      <h1 className="text-2xl font-bold mb-6">Create a New Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-medium mb-1">
            Title<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 p-2 rounded-md"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            className="w-full border border-gray-300 p-2 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Image */}
        <div>
          <label className="block font-medium mb-1">Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium mb-1">Notes</label>
          <textarea
            className="w-full border border-gray-300 p-2 rounded-md"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="block font-medium mb-2">Ingredients</label>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="grid grid-cols-2 gap-2 mb-4">
              <input
                type="text"
                placeholder="Name"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.name}
                onChange={(e) =>
                  handleIngredientChange(index, "name", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Quantity"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.quantity}
                onChange={(e) =>
                  handleIngredientChange(index, "quantity", e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Unit"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.unit}
                onChange={(e) =>
                  handleIngredientChange(index, "unit", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Calories *"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.calories}
                onChange={(e) =>
                  handleIngredientChange(index, "calories", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Protein (g)"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.protein}
                onChange={(e) =>
                  handleIngredientChange(index, "protein", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Fat (g)"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.fat}
                onChange={(e) =>
                  handleIngredientChange(index, "fat", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                className="border border-gray-300 p-2 rounded-md"
                value={ingredient.carbs}
                onChange={(e) =>
                  handleIngredientChange(index, "carbs", e.target.value)
                }
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="mt-2 text-blue-600 hover:underline"
          >
            + Add Ingredient
          </button>
        </div>
        <div>
          <label className="block font-medium mb-1">Servings</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 4"
            className="w-full border border-gray-300 p-2 rounded-md"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 text-white px-4 py-2 rounded-md ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Recipe"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRecipe;
