import { useEffect } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import schoolJson from "@shared/jsons/schools.json";
import SchoolIcon from "../widgets/SchoolIcon";

const Schools = () => {
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();

  useEffect(() => {
    setNavbarButtonsByType(["logo", "themeToggle"]);
    setNavbarTitle(undefined);
  }, []);

  return (
    <div className="pt-18 flex flex-col items-center min-h-screen bg-base-300">
      <ul className="mx-auto max-w-lg w-full grid grid-cols-2 lg:grid-cols-3 p-4 gap-4">
        {schoolJson.map((school) => (
          <li key={school.abbreviation}>
            <div className="w-full flex flex-col items-center justify-center bg-base-100 py-4 rounded-box">
              <div className="p-3 bg-white rounded-full overflow-clip">
                <SchoolIcon
                  abbreviation={school.abbreviation}
                  className="w-14 h-14"
                />
              </div>
              <p>{school.name}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Schools;
