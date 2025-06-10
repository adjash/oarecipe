import type { Session, User } from "@supabase/supabase-js";

export interface Ingredient {
  id?: number;
  recipe_id: number;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
}

export interface Recipe {
  id: number;
  title: string;
  description?: string | null;
  notes?: string | null;
  image_url?: string | null;
  user_id: string;
  slug: string;
  servings?: number | null;
  total_calories?: number | null;
  total_protein?: number | null;
  total_fat?: number | null;
  total_carbs?: number | null;
  created_at?: string;
}

// Custom success/error union type for register
export type RegisterResult =
  | { success: true; user: User | null }
  | { success: false; error: Error };

// Custom success/error union type for sign in
export type SignInResult =
  | { success: true; data: { user: User; session: Session } }
  | { success: false; error: string };

// AuthContext type
export interface AuthContextType {
  session: Session | null;
  registerNewUser: (email: string, password: string) => Promise<RegisterResult>;
  signInUser: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}
