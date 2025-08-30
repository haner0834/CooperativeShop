import { useEffect, useRef, type ReactNode } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import Logo from "@shared/app-icons/logo.jpg";
import VerticalLogo from "@shared/app-icons/logo-vertical.svg?react";
import {
  ArrowDown,
  Bmsh,
  Ccsh,
  Cjshs,
  Dwsh,
  Frog,
  Github,
  Globe,
  Google,
  Hhsh,
  Hhvs,
  Hkhs,
  Hyivs,
  Hysh,
  IdCard,
  Instagram,
  Kmsh,
  Lmsh,
  Mail,
  Mdsh,
  MoveRight,
  Nkhs,
  Nnkieh,
  Nnsh,
  Pmai,
  QrCode,
  ScanLine,
  School,
  Sfsh,
  Tcjh,
  Tncvs,
  Tnssh,
  Tntcshsa,
  Tnvs,
  Twais,
  Twvs,
  Yhsh,
  Yrhs,
} from "@icons";
import Marquee from "../widgets/Marquee";
import WordScroller from "../widgets/WordScroller";
import { motion, useScroll, useTransform } from "framer-motion";

const ScanButton = () => {
  return (
    <a href="/qr-scanner" className="btn btn-circle btn-ghost">
      <ScanLine />
    </a>
  );
};

const Banner = () => {
  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="hidden lg:block rotate-6 md:ms-10 rounded-box flex-col bg-black/5 w-lg p-4">
          <div className="flex opacity-100">
            <img src={Logo} alt="Logo" className="w-40 h-40 rounded-field" />

            <ul className="px-4 w-full flex flex-col justify-between">
              <li>
                <p className="font-bold text-xl pb-2">南校特約</p>
              </li>
              <li className="flex flex-1 justify-between font-mono">
                <p>年級</p>
                <p className="text-primary font-bold">高中部</p>
              </li>

              <li className="flex flex-1 justify-between font-mono">
                <p>學校</p>
                <p>kmsh</p>
              </li>

              <li className="flex flex-1 justify-between font-mono">
                <p>開始日期</p>
                <p>26/01/01</p>
              </li>
              <li className="flex flex-1 justify-between font-mono">
                <p>結束日期</p>
                <p>26/06/01</p>
              </li>
            </ul>
          </div>
          <div className="divider" />
          <div className="flex space-x-2">
            <span className="badge badge-info badge-soft">
              <ScanLine className="w-4 h-4" />
              QR Code
            </span>
            <span className="badge badge-primary badge-soft">
              <Globe className="w-4 h-4" />
              Website
            </span>
            <span className="badge badge-secondary badge-soft">
              <School className="w-4 h-4" />
              26 校聯合
            </span>
          </div>
        </div>
        <div className="lg:w-lg">
          <h1 className="text-[clamp(2rem,3.5vw,4rem)]/tight  font-bold text-center lg:text-left">
            26校聯合
            <br />
            史上最大學生優惠計畫
          </h1>
          <p className="py-6 opacity-50 text-center lg:text-left">
            由台南 26 所高中學生會共同發起，串聯超過 200
            間在地商店，打造專屬學生的優惠網絡。
            <br />
            只要學生證或 QR Code，一掃即享，最方便的校園生活福利！
          </p>
          <div className="space-x-2 flex justify-center lg:justify-start">
            <a
              className="btn btn-soft btn-neutral rounded-full"
              target="_blank"
              href="https://www.instagram.com/cooperativeshops_2026/"
            >
              <Instagram />
              Instagram
            </a>
            <a
              href="/choose-school"
              className="btn btn-primary rounded-full lg:btn-wide px-8"
            >
              立即開始
              <MoveRight />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const schoolIconClassName = "h-[clamp(3rem,6vw,6rem)] w-auto" as const;

const schoolIcons: ReactNode[][] = [
  [
    <Bmsh className={schoolIconClassName} />,
    <Ccsh className={schoolIconClassName} />,
    <Cjshs className={schoolIconClassName} />,
    <Dwsh className={schoolIconClassName} />,
    <Hhsh className={schoolIconClassName} />,
    <Hhvs className={schoolIconClassName} />,
    <Hkhs className={schoolIconClassName} />,
    <Hyivs className={schoolIconClassName} />,
    <Hysh className={schoolIconClassName} />,
  ],
  [
    <Kmsh className={schoolIconClassName} />,
    <Lmsh className={schoolIconClassName} />,
    <Mdsh className={schoolIconClassName} />,
    <Nkhs className={schoolIconClassName} />,
    <Nnkieh className={schoolIconClassName} />,
    <Nnsh className={schoolIconClassName} />,
    <Pmai className={schoolIconClassName} />,
    <Sfsh className={schoolIconClassName} />,
    <Tcjh className={schoolIconClassName} />,
  ],
  [
    <Tncvs className={schoolIconClassName} />,
    <Tnssh className={schoolIconClassName} />,
    <Tntcshsa className={schoolIconClassName} />,
    <Tnvs className={schoolIconClassName} />,
    <Twais className={schoolIconClassName} />,
    <Twvs className={schoolIconClassName} />,
    <Yhsh className={schoolIconClassName} />,
    <Yrhs className={schoolIconClassName} />,
  ],
];

const SecondPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold tracking-wider flex">
        <p className="text-success">26</p> 校聯合舉辦
      </h1>
      <p className="opacity-50 pt-4 px-4 text-center">
        200+ 店家合作，範圍涵蓋飲食、文具、咖啡廳與生活服務
      </p>
      <div className="space-y-2 py-10 w-screen">
        {schoolIcons.map((icons, index) => (
          <Marquee
            elements={icons}
            key={index}
            speed={30}
            pauseOnHover
            direction={index % 2 !== 0 ? "left" : "right"}
            gap={40}
            className="py-4"
          />
        ))}
      </div>

      <a href="/schools" className="btn btn-primary btn-wide">
        查看所有學校
      </a>
    </div>
  );
};

const ThirdPage = () => {
  const words = [
    "全新方式",
    "結合",
    "Google 登入",
    "以及",
    "QR Code",
    "更便利",
    "更快速",
  ];
  const scrollHeightPerWord = 300;

  const gradientStyle = {
    background:
      "radial-gradient(circle at 30% 50%, #007bff -200%, transparent 35%), radial-gradient(circle at 70% 60%, #28a745 -200%, transparent 30%)",
    width: "100%",
  };

  const scrollTrackHeight = (words.length + 2) * scrollHeightPerWord;
  const stickyContainerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="relative" style={{ height: `${scrollTrackHeight}px` }}>
        <div
          ref={stickyContainerRef}
          className="sticky top-0 h-screen w-full overflow-hidden"
          style={gradientStyle}
        >
          <WordScroller
            scrollHeightPerWord={scrollHeightPerWord}
            words={words}
            stickyContainerRef={stickyContainerRef}
          />
        </div>
      </div>
    </>
  );
};

const FourthPage = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // 用 step function 控制 opacity
  const getStepOpacity = (start: number) => {
    return useTransform(scrollYProgress, (v) => (v >= start ? 1 : 0.2));
  };

  const opacity1 = getStepOpacity(0.2);
  const opacity2 = getStepOpacity(0.4);
  const opacity3 = getStepOpacity(0.6);

  return (
    <div ref={containerRef} className="h-[200vh] bg-white">
      <div className="sticky top-1/2 -translate-y-1/2 flex flex-col items-center">
        <h1 className="text-5xl lg:text-7xl font-bold flex">
          <motion.span style={{ opacity: opacity1 }}>不再</motion.span>
          <motion.span style={{ opacity: opacity2 }}>需要</motion.span>
          <motion.span className="text-accent" style={{ opacity: opacity3 }}>
            學生證
          </motion.span>
        </h1>
        <p className="opacity-50 pt-4 mx-2 text-center max-w-xl">
          QR Code 即時認證，搭配學校 Google
          帳號或學號登入，讓消費更快速、更便利。
        </p>
      </div>
    </div>
  );
};

const FifthPage = () => {
  return (
    <div className="h-screen bg-neutral flex flex-col xl:flex-row items-center justify-center xl:justify-between xl:px-30 text-base-100 gap-10">
      <div className="text-center flex flex-col items-center justify-center xl:text-left xl:items-start space-y-4">
        <h1 className="text-2xl font-bold lg:text-5xl">
          使用學校的 Google 帳號或學號登入
        </h1>
        <h2 className="text-2xl lg:text-4xl font-light">
          一鍵登入，立即解鎖優惠
        </h2>

        <p className="opacity-50 max-w-lg mx-2">
          使用學校 Google 帳號或學號登入，立即生成專屬 QR Code。全台南 200+
          間合作店家，憑此即可享受學生限定優惠，便利又快速，安全且專屬於你。
        </p>

        <a href="/choose-school" className="btn btn-base-100 btn-wide my-10">
          立即登入
        </a>
      </div>

      <div className="flex flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <Google className="w-16 h-16 p-2 m-1 bg-white rounded-full" />
            <p className="text-xs opacity-50">學校帳號</p>
          </div>

          <p className="font-semibold opacity-50">OR</p>

          <div className="flex flex-col items-center gap-1">
            <IdCard className="w-18 h-18" />
            <p className="text-xs opacity-50">學號</p>
          </div>
        </div>

        <ArrowDown className="w-5 h-5" />

        <div className="flex flex-col items-center">
          <QrCode className="w-22 h-22 text-blue-300" />
          <p className="text-xs opacity-50">個人 QR Code</p>
        </div>
      </div>
    </div>
  );
};

const SixthPage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <VerticalLogo className="w-xs" />
    </div>
  );
};

const Footer = () => {
  return (
    <>
      <footer className="footer sm:footer-horizontal bg-base-300 text-base-content p-10">
        <nav>
          <h6 className="footer-title">Pages</h6>
          <a className="link link-hover" href="/qr-scanner">
            QR Scanner
          </a>
          <a className="link link-hover" href="/home">
            Home
          </a>
          <a className="link link-hover" href="/choose-school">
            Login
          </a>
        </nav>
        <nav>
          <h6 className="footer-title">Legal</h6>
          <a href="/privacy-policy.html">隱私政策</a>
          <a href="/cookie-policy.html">Cookie 政策</a>
          <p>© 林禹澔 {new Date().getFullYear()} - All right reserved</p>
        </nav>
        <nav>
          <h6 className="footer-title">Social</h6>
          <div className="grid grid-flow-col gap-4">
            <a href="https://www.instagram.com/cooperativeshops_2026/">
              <Instagram />
            </a>
            <a href="https://youtu.be/xvFZjo5PgG0?si=yd4-GfTLyVF-3RCy">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current"
              >
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
              </svg>
            </a>
            <a href="mailto:cooperativeshops2025@gmail.com">
              <Mail />
            </a>

            <a href="">
              <Github />
            </a>
          </div>
        </nav>
      </footer>

      <footer className="footer sm:footer-horizontal bg-base-300 text-base-content p-10">
        <div className="flex items-center">
          <Frog className="avator w-15 rounded-full border-1 border-black/5" />

          <div>
            <p className="text-sm opacity-60">Created by</p>
            <h6 className="text-lg font-bold">林禹澔</h6>
          </div>

          <div>
            <p className="text-sm opacity-60">贊助商（300廣告位）</p>
            <h6 className="text-lg font-bold">方允可</h6>
          </div>
        </div>
      </footer>
    </>
  );
};

const Intro = () => {
  const { setNavbarButtons } = useNavbarButtons();
  useEffect(() => {
    const baseButtons: NavbarButton[] = (
      ["logo", "login"] as NavbarButtonType[]
    )
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const scanButton: NavbarButton = {
      placement: "end",
      id: "navbar_scan_btn",
      content: <ScanButton />,
    };

    setNavbarButtons([...baseButtons, scanButton]);

    setTimeout(() => {
      document.documentElement.setAttribute("data-theme", "light");
    }, 0);
  }, []);

  return (
    <div className="min-h-screen w-screen">
      <Banner />
      <SecondPage />
      <ThirdPage />
      <FourthPage />
      <FifthPage />
      <SixthPage />
      <Footer />
    </div>
  );
};

export default Intro;
