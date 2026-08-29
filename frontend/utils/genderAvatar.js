export const getGenderAvatar = (user) => {
  const gender = user?.gender;
  const role = user?.role;

  if (role === "child") {
    if (gender === "female") return "👧🏼";
    if (gender === "male") return "👦🏻";
  }

  if (role === "parent") {
    if (gender === "female") return "👩🏼";
    if (gender === "male") return "👨🏻";
  }

  return "👤";
};
