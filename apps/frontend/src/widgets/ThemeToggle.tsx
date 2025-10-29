import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  // Initialize theme state (localStorage storage)
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const isDarkMode =
      storedTheme === "dark" ||
      (!storedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="me-2 btn btn-circle btn-ghost">
      <label className="swap swap-rotate h-10">
        {/* checkbox controls theme state */}
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleTheme}
          className="theme-controller sr-only"
        />

        <Sun className="swap-off" />

        <Moon className="swap-on" />
      </label>
    </div>
  );
};

export default ThemeToggle;
