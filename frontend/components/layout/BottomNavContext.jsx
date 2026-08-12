"use client";

import { createContext } from "react";

export const BottomNavContext = createContext({
  showBottomNav: true,
  setShowBottomNav: () => {},
});

export default BottomNavContext;
