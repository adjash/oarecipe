import { Outlet } from "react-router";
import Navigation from "../Navigation/Navigation";

const Layout = () => {
  return (
    <>
      <Navigation />
      <Outlet />
    </>
  );
};

export default Layout;
