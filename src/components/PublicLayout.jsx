import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default PublicLayout;
