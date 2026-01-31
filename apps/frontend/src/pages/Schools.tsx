import SchoolIcon from "../widgets/SchoolIcon";
import PageMeta, { routesMeta } from "../widgets/PageMeta";
import { ChevronRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import Logo from "@shared/app-icons/cooperativeshop-logo.svg?react";
import Sidebar from "../widgets/Sidebar";
import { SidebarContent } from "../widgets/SidebarContent";
import { Link } from "react-router-dom";
import type { School } from "../types/school";
import { getErrorMessage } from "../utils/errors";
import { path } from "../utils/path";
import { useModal } from "../widgets/ModalContext";
import { useAuth } from "../auth/AuthContext";

const Schools = () => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const { showModal } = useModal();
  const { activeUserRef } = useAuth();

  useEffect(() => {
    const a = async () => {
      const res = await fetch(path("/api/schools/all"), {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const json = await res.json();
      if (!json.success) {
        showModal({
          title: "Unexpected error occured.",
          description: getErrorMessage(json.error.code),
          showDismissButton: true,
        });
      }

      setSchools(json.data);
    };
    a();
  }, []);

  return (
    <>
      <PageMeta {...routesMeta.schools} />

      <nav className="navbar bg-base-100 fixed top-0 z-50 shadow-xs">
        <div className="navbar-start space-x-4">
          <button
            className="btn btn-ghost btn-square"
            onClick={() => setShowSidebar((prev) => !prev)}
          >
            <Menu />
          </button>
          <Logo className="h-9 w-auto hidden lg:block" />
        </div>
        <div className="navbar-center">
          <h1 className="font-semibold">合作學校</h1>
        </div>
        <div className="navbar-end"></div>
      </nav>

      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)}>
        <SidebarContent />
      </Sidebar>

      <div className="pt-18 flex flex-col items-center min-h-screen bg-base-300 lg:ps-64 pwa:pb-pwa">
        <ul className="mx-auto max-w-lg w-full flex flex-col p-4 gap-4">
          {schools.map((school) => (
            <li key={school.abbreviation}>
              <Link
                to={
                  activeUserRef.current?.schoolId === school.id
                    ? "/schools/me"
                    : `/schools/${school.abbreviation}`
                }
              >
                <div className="w-full flex items-center bg-base-100 p-4 gap-4 rounded-box">
                  <div className="p-3 bg-white rounded-full overflow-clip">
                    <SchoolIcon
                      abbreviation={school.abbreviation}
                      className="w-14 h-14"
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-lg">{school.name}</h4>
                    <span className="opacity-50 text-sm">
                      {school.abbreviation} &middot; {school.shopsCount}{" "}
                      間特約商家
                    </span>
                  </div>

                  {activeUserRef.current?.schoolId === school.id && (
                    <span className="badge badge-sm badge-neutral badge-soft -me-4">
                      我的學校
                    </span>
                  )}

                  <ChevronRight className="opacity-50" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Schools;
