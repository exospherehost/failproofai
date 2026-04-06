/** Exosphere logo that switches between light and dark variants based on the current theme. */
"use client";

import React from "react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  width = 32,
  height = 32,
  className = "",
}) => {
  const { theme } = useTheme();

  // In light mode, show dark logo; in dark mode, show regular logo
  const logoSrc =
    theme === "light" ? "/exospheresmall-dark.png" : "/exospheresmall.png";

  return (
    <Image
      src={logoSrc}
      alt="Exosphere Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
};

