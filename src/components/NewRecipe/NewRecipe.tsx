import { useState } from "react";
import supabase from "../../utils/supabase";
import { UserAuth } from "../../context/AuthContext";
import BarcodeScanner from "react-qr-barcode-scanner";
import { useNavigate } from "react-router";

// Define the ingredient interface
interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  // New per-100g values:
  caloriesPer100?: number;
  proteinPer100?: number;
  fatPer100?: number;
  carbsPer100?: number;

  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  image_url: string;
  offResults: any[];
  showResults: boolean;
}

const NewRecipe = () => {
  const { session } = UserAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    {
      name: "",
      quantity: "",
      unit: "",
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
      image_url: "",
      offResults: [] as any[],
      showResults: false,
    },
  ]);
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const [barcodeError, setBarcodeError] = useState<string>("");

  const [servings, setServings] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState<boolean[]>([]);
  const navigate = useNavigate();

  const fetchProductByBarcode = async (barcode: string, index: number) => {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const { status, product } = await res.json();
      if (status !== 1 || !product) {
        setBarcodeError("Product not found");
        return;
      }
      selectOFFProduct(index, product);
    } catch {
      setBarcodeError("Fetch failed");
    } finally {
      setScanningIndex(null);
    }
  };

  const fetchOFFResults = async (query: string, index: number) => {
    if (query.length < 3) return;

    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          query
        )}&search_simple=1&action=process&json=1&fields=product_name,image_url,nutriments,brands`
      );
      const data = await res.json();
      const updated = [...ingredients];
      //if we want to restrict how many results come thru
      // updated[index].offResults = data.products.slice(0, 5);
      updated[index].offResults = data.products;
      updated[index].showResults = true;
      setIngredients(updated);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const performSearch = async (query: string, index: number) => {
    if (query.length < 3) return;

    setIsSearching((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });

    try {
      await fetchOFFResults(query, index);
    } finally {
      setIsSearching((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  // Manual search function
  const handleManualSearch = (index: number) => {
    const query = ingredients[index].name;
    performSearch(query, index);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | boolean | any[]
  ) => {
    const updated = [...ingredients] as Ingredient[];
    // Apply the raw change first
    (updated[index] as any)[field] = value;

    // If they typed a new quantity, recompute calories/macros
    if (field === "quantity") {
      const qty = parseFloat(value as string);
      const ing = updated[index];

      if (!isNaN(qty) && ing.caloriesPer100 != null) {
        ing.calories = Math.round((ing.caloriesPer100! * qty) / 100).toString();
      }
      if (!isNaN(qty) && ing.proteinPer100 != null) {
        ing.protein = ((ing.proteinPer100! * qty) / 100).toFixed(1);
      }
      if (!isNaN(qty) && ing.fatPer100 != null) {
        ing.fat = ((ing.fatPer100! * qty) / 100).toFixed(1);
      }
      if (!isNaN(qty) && ing.carbsPer100 != null) {
        ing.carbs = ((ing.carbsPer100! * qty) / 100).toFixed(1);
      }
    }

    // Clear results dropdown on name edits
    if (field === "name" && typeof value === "string") {
      updated[index].showResults = false;
      updated[index].offResults = [];
    }

    setIngredients(updated);
  };

  const selectOFFProduct = (index: number, product: any) => {
    const updated = [...ingredients];
    const nutriments = product.nutriments || {};

    // Grab the raw numbers if they exist
    const kcal100 = nutriments["energy-kcal_100g"];
    const prot100 = nutriments["proteins_100g"];
    const fat100 = nutriments["fat_100g"];
    const carb100 = nutriments["carbohydrates_100g"];

    // Default to 100g
    const defaultQty = 100;

    updated[index] = {
      ...updated[index],
      name:
        product.product_name ||
        `${product.brands || ""} ${product.product_name}`,
      unit: "g",
      quantity: defaultQty.toString(),

      // Store per-100g
      caloriesPer100: kcal100 != null ? +kcal100 : undefined,
      proteinPer100: prot100 != null ? +prot100 : undefined,
      fatPer100: fat100 != null ? +fat100 : undefined,
      carbsPer100: carb100 != null ? +carb100 : undefined,

      // Compute total based on 100g
      calories:
        kcal100 != null
          ? Math.round((kcal100 * defaultQty) / 100).toString()
          : "",
      protein: prot100 != null ? ((prot100 * defaultQty) / 100).toFixed(1) : "",
      fat: fat100 != null ? ((fat100 * defaultQty) / 100).toFixed(1) : "",
      carbs: carb100 != null ? ((carb100 * defaultQty) / 100).toFixed(1) : "",

      image_url: product.image_url || "",
      showResults: false,
      offResults: [],
    };

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
        image_url: "",
        offResults: [],
        showResults: false,
      },
    ]);

    // Extend the isSearching array
    setIsSearching((prev) => [...prev, false]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setIsSearching((prev) => prev.filter((_, i) => i !== index));
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
        console.error("Image upload failed:", uploadError);
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
      console.error("Error saving recipe:", insertError);
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
        console.error("Error saving ingredients:", ingredientError);
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
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-xl mt-8">
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
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 mb-4 relative"
            >
              <div className="grid grid-cols-1 gap-2 mb-2">
                {/* Name input with search button */}
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    placeholder="Name (auto-searches as you type)"
                    className="flex-1 border border-gray-300 p-2 rounded-md"
                    value={ingredient.name}
                    onChange={(e) =>
                      handleIngredientChange(index, "name", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleManualSearch(index)}
                    disabled={
                      ingredient.name.length < 3 || isSearching[index] || false
                    }
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center gap-1 whitespace-nowrap"
                  >
                    {isSearching[index] ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Searching...
                      </>
                    ) : (
                      "Search"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setScanningIndex(index)}
                    className="px-3 py-2 bg-green-500 text-white rounded-md"
                  >
                    Scan Barcode
                  </button>
                  {/* Search Results Dropdown */}
                  {ingredient.showResults &&
                    ingredient.offResults.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto top-full left-0">
                        {ingredient.offResults.map((product, productIndex) => (
                          <div
                            key={productIndex}
                            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectOFFProduct(index, product)}
                          >
                            <div className="w-12 h-12 mr-3 flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.product_name}
                                  className="w-full h-full object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.product_name}
                              </p>
                              {product.brands && (
                                <p className="text-xs text-gray-500 truncate">
                                  {product.brands}
                                </p>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {product.nutriments?.["energy-kcal_100g"] && (
                                  <span className="mr-2">
                                    {Math.round(
                                      product.nutriments["energy-kcal_100g"]
                                    )}{" "}
                                    kcal/100g
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <details>
                  <summary>Nutritional Information: </summary>
                  <div>
                    <label htmlFor="quantity">Quantity: </label>
                    <input
                      type="number"
                      id="quantity"
                      placeholder="Quantity"
                      className="border border-gray-300 p-2 rounded-md"
                      value={ingredient.quantity}
                      onChange={(e) =>
                        handleIngredientChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="unit">Unit: </label>
                    <input
                      type="text"
                      id="unit"
                      placeholder="Unit"
                      className="border border-gray-300 p-2 rounded-md"
                      value={ingredient.unit}
                      onChange={(e) =>
                        handleIngredientChange(index, "unit", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="calories">Calories: </label>
                    <input
                      type="number"
                      id="calories"
                      placeholder="Calories *"
                      className="border border-gray-300 p-2 rounded-md"
                      value={ingredient.calories}
                      onChange={(e) =>
                        handleIngredientChange(
                          index,
                          "calories",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="protein">Protein: </label>
                    <input
                      type="number"
                      placeholder="Protein (g)"
                      className="border border-gray-300 p-2 rounded-md"
                      value={ingredient.protein}
                      onChange={(e) =>
                        handleIngredientChange(index, "protein", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="fat">Fat: </label>
                    <input
                      type="number"
                      id="fat"
                      placeholder="Fat (g)"
                      className="border border-gray-300 p-2 rounded-md"
                      value={ingredient.fat}
                      onChange={(e) =>
                        handleIngredientChange(index, "fat", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="carbs">Carbs: </label>
                    <input
                      type="number"
                      id="carbs"
                      placeholder="Carbs (g)"
                      className="border border-gray-300 p-2 rounded-md"
                      value={ingredient.carbs}
                      onChange={(e) =>
                        handleIngredientChange(index, "carbs", e.target.value)
                      }
                    />
                  </div>
                </details>
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Remove Ingredient
              </button>
              {scanningIndex === index && (
                <div className="relative w-full h-64 border border-gray-300 mt-2">
                  <BarcodeScanner
                    width={500}
                    height={350}
                    onUpdate={(err, result) => {
                      if (err) {
                        console.error(err);
                        setBarcodeError("Camera error");
                        return;
                      }
                      if (result) {
                        fetchProductByBarcode(result.getText(), index);
                        setScanningIndex(null);
                        setBarcodeError("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
                    onClick={() => setScanningIndex(null)}
                  >
                    Cancel
                  </button>
                  {barcodeError && (
                    <p className="text-red-600 text-xs mt-1">{barcodeError}</p>
                  )}
                </div>
              )}
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
