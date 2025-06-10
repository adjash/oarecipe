import { createBrowserRouter } from "react-router";
import Layout from "../components/Layout/Layout";
import App from "../App";
import SignUp from "../components/SignUp/SignUp";
import SignIn from "../components/SignIn/SignIn";
import Page404 from "../components/404/404";
import NewRecipe from "../components/NewRecipe/NewRecipe";
import MyRecipes from "../components/MyRecipes/MyRecipes";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <App /> },
      { path: "signup", element: <SignUp /> },
      { path: "signin", element: <SignIn /> },
      {
        path: "new-recipe",
        element: (
          <ProtectedRoute>
            <NewRecipe />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-recipes",
        element: (
          <ProtectedRoute>
            <MyRecipes />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <Page404 /> },
    ],
  },
]);
