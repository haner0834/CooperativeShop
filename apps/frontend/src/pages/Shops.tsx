import { useEffect, useState } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import {
  Bookmark,
  ChevronRight,
  IdCard,
  MapPin,
  Phone,
  School,
} from "lucide-react";
import Sidebar from "../widgets/Sidebar";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="flex justify-between sm:justify-start items-center mb-4 mx-4">
      <h2 className="font-bold text-2xl">{title}</h2>

      <ChevronRight />
    </div>
  );
};

const ShopCard = ({ shop, className }: { shop: any; className: string }) => {
  const badgeStyle = shop.isOpen ? "badge-success" : "badge-error";
  return (
    <article className="space-y-2">
      <figure className={`${className} bg-gray-300 rounded-box`} />

      <div className="">
        <h3 className="text-lg font-bold">My Store</h3>

        <p className="opacity-60 text-sm">台南市東區 123 巷 567 號 101 樓</p>

        <div className="space-x-2">
          <span className={`badge ${badgeStyle} badge-soft uppercase mt-2`}>
            {shop.isOpen ? "open" : "closed"}
          </span>
          <span className={`badge badge-info badge-soft uppercase mt-2`}>
            <Phone className="w-4 h-4" /> 0912-345-678
          </span>
        </div>
      </div>
    </article>
  );
};

const SearchBar = ({
  search,
  handleSearch,
}: {
  search: string;
  handleSearch: (n: string) => void;
}) => {
  return (
    <label className="input w-[clamp(100px,40vw,400px)]">
      <svg
        className="h-[1em] opacity-50"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2.5"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </g>
      </svg>
      <input
        type="search"
        className="grow"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜尋商家"
      />
    </label>
  );
};

const Shops = () => {
  const { setNavbarTitle, setNavbarButtons } = useNavbarButtons();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleSearch = (newValue: string) => {
    setSearch(newValue);
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  useEffect(() => {
    const baseButtons: NavbarButton[] = (
      ["logo", "themeToggle"] as NavbarButtonType[]
    )
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const searchBar: NavbarButton = {
      content: <SearchBar search={search} handleSearch={handleSearch} />,
      placement: "center",
    };

    setNavbarButtons([...baseButtons, searchBar]);
    setNavbarTitle(undefined);
  });

  return (
    <div className="pt-18">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar}>
        <div className="pt-18">
          <ul className="menu bg-base-100 min-h-full w-64 p-4">
            {/* Sidebar content here */}
            <li>
              <a>
                <Bookmark className="w-5 h-5" /> Saved
              </a>
            </li>
            <li>
              <a>
                <MapPin className="w-5 h-5" />
                Map
              </a>
            </li>
            <li>
              <a>
                <IdCard className="w-5 h-5" />
                Personal QR Code
              </a>
            </li>
            <li>
              <a>
                <School className="w-5 h-5" />
                All Schools
              </a>
            </li>
          </ul>
        </div>
      </Sidebar>

      <main className="bg-base-100 min-h-screen pt-4 space-y-8 lg:ps-64">
        <section className="">
          <SectionTitle title="Recent Visited" />

          <div className="overflow-x-scroll whitespace-normal px-4">
            <div className="inline-flex space-x-4">
              {[0, 1, 2, 3].map((i) => {
                const isOpen = i % 2 === 0;
                return <ShopCard shop={{ isOpen }} className="w-85 h-45" />;
              })}
            </div>
          </div>
        </section>

        <section className="">
          <SectionTitle title="All Shops" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4 space-y-2">
            {[...Array(10).keys()].map((i) => {
              const isOpen = i % 2 === 0;
              return (
                <ShopCard shop={{ isOpen }} className="w-full aspect-[5/3]" />
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Shops;
