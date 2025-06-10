import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { UserAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { session } = UserAuth();

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
