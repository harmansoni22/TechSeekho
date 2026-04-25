"use client";

import StaggeredMenu from "./StaggeredMenu";

const Navbar = () => {
  const menuItems = [
    {
      label: "Home",
      ariaLabel: "Go to Home Page",
      link: "/landingpage",
    },
    {
      label: "About",
      ariaLabel: "Know More About Us",
      link: "/landingpage/about",
    },
    {
      label: "Services",
      ariaLabel: "Our Services",
      link: "/landingpage/services",
    },
    {
      label: "Courses",
      ariaLabel: "Explore Our Courses",
      link: "/landingpage/courses",
    },
    {
      label: "Contact",
      ariaLabel: "Contact Us",
      link: "/landingpage/contact",
    },
  ];

  const socialItems = [
    {
      label: "X",
      link: "https://x.com",
    },
    {
      label: "Github",
      link: "https://github.com",
    },
    {
      label: "LinkedIn",
      link: "https://linkedin.com",
    },
  ];

  const headerActions = [
    {
      label: "Login",
      link: "/login",
      ariaLabel: "Login to your account",
      variant: "secondary",
    },
    {
      label: "Sign Up",
      link: "/signup",
      ariaLabel: "Create a new account",
      variant: "primary",
    },
  ];

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <StaggeredMenu
        position="right"
        items={menuItems}
        socialItems={socialItems}
        headerActions={headerActions}
        displaySocials
        displayItemNumbering={false}
        isFixed={true}
        menuButtonColor="#ffffff"
        openMenuButtonColor="#ffffff"
        changeMenuColorOnOpen={true}
        colors={["#9ea5ef", "#2739ff"]}
        logoUrl="/logo-removebg-preview.png"
        accentColor="#3075ff"
      />
    </div>
  );
};

export default Navbar;
