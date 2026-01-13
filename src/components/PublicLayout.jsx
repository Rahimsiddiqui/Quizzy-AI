import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;
