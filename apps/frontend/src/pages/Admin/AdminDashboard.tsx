import { Link } from "react-router-dom";
import { CircleUser, NotepadText } from "lucide-react";

const Navbar = ({}: {}) => {
  return (
    <div className="navbar bg-base-100 shadow-sm z-50 fixed">
      <div className="flex-1 ms-2"></div>
      <div className="flex-1 text-center">
        <h1 className="text-base font-semibold">Admin Console</h1>
      </div>
      <div className="flex-1 flex me-2 gap-4 justify-end items-center"></div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <div>
      <Navbar />

      <main className="bg-base-300 min-h-screen w-full flex flex-col items-center p-4 pt-21">
        <ul className="menu bg-base-100 w-full rounded-box max-w-md">
          <li className="menu-disabled">
            <p>HAHA PIYAN</p>
          </li>
          <li>
            <Link to="/admin/auth-console">
              <CircleUser />
              Admin Member Console
            </Link>
          </li>
          <li>
            <Link to="/admin/draft-review-list">
              <NotepadText />
              商家資料審查
            </Link>
          </li>
          {/* <li>
            <Link to="/admin/school-console">
              <School />
              School Console
            </Link>
          </li> */}
        </ul>
      </main>
    </div>
  );
};

export default AdminDashboard;
