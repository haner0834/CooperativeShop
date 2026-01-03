import { useEffect, useRef } from "react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import Logo from "@shared/app-icons/logo.jpg";
import { Instagram, Github, Frog } from "@icons";
import Marquee from "../widgets/Marquee";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import PageMeta, { routesMeta } from "../widgets/PageMeta";
import {
  ArrowRight,
  CheckCircle2,
  ScanLine,
  School,
  Smartphone,
  Zap,
} from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useMemo } from "react";
import { useDevice } from "../widgets/DeviceContext";
import { Link } from "react-router-dom";

// const ScanButton = () => (
//   <Link to="/qr-scanner" className="btn btn-circle btn-ghost">
//     <ScanLine />
//   </Link>
// );

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-base-100">
      <div className="container px-4 mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        {/* 左側：文案 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 text-center lg:text-left space-y-6 z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-base-200/50 border border-base-300 text-sm font-medium text-base-content/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            26 校聯合．現已上線
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            校園生活，
            <br />
            <span className="">一掃即享。</span>
          </h1>

          <p className="text-lg text-base-content/60 max-w-lg mx-auto lg:mx-0 leading-relaxed">
            全台南最大學生優惠計畫。串聯 200+ 間在地商店，
            不需要實體卡片，只需你的手機。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-4">
            <Link
              to="/choose-school"
              className="btn btn-primary rounded-full px-8 text-lg font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              立即開始
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/shops"
              className="btn btn-ghost rounded-full px-8 text-lg font-normal hover:bg-base-content/5 text-neutral/50"
            >
              查看合作店家
            </Link>
          </div>
        </motion.div>

        {/* 右側：浮動卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex-1 w-full max-w-md relative"
        >
          <div
            className="absolute top-10 -left-4 w-32 h-32 bg-blue-500 rounded-full blur-[50px] opacity-60 animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-10 -right-4 w-32 h-32 bg-emerald-500 rounded-full blur-[50px] opacity-60 animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "1s" }}
          />

          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <div className="relative w-full aspect-[1.58/1] rounded-box border border-base-300 bg-base-100 shadow-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-base-100 to-base-200 opacity-50" />

              <div className="relative p-6 h-full flex flex-col justify-between text-base-content">
                <div className="flex justify-between items-start">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="w-16 h-16 rounded-2xl shadow-md"
                  />
                  <ScanLine className="w-8 h-8 opacity-50" />
                </div>
                <div>
                  <div className="font-mono text-sm opacity-50 mb-1">
                    2026 COOPERATIVE
                  </div>
                  <div className="text-2xl font-bold tracking-widest uppercase">
                    Student ID
                  </div>
                </div>
                <div className="flex justify-between items-end font-mono text-xs opacity-70">
                  <span>TAINAN UNION</span>
                  <span>VALID THRU 06/26</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="absolute -bottom-10 left-10 right-10 h-10 bg-black/20 blur-2xl rounded-full opacity-40" />
        </motion.div>
      </div>
    </section>
  );
};

const schoolIconClassName = (isMobile: boolean) =>
  `h-16 w-16 object-contain grayscale ${
    isMobile ? "grayscale-0" : "opacity-50"
  } hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer mx-6`;

const schoolIconFileNames: string[][] = [
  [
    "bmsh.png",
    "ccsh.png",
    "cjshs.png",
    "dwsh.png",
    "hhsh.png",
    "hhvs.png",
    "ctbchs.png",
    "hyivs.png",
    "hysh.png",
  ],
  [
    "kmsh.gif",
    "lmsh.png",
    "mdsh.png",
    "nkhs.png",
    "nnkieh.jpg",
    "nnsh.png",
    "pmai.png",
    "sfsh.gif",
    "tcjh.jpeg",
  ],
  [
    "tncvs.png",
    "tnssh.png",
    "tntcshsa.gif",
    "tnvs.png",
    "twais.png",
    "twvs.png",
    "yhsh.png",
    "yrhs.png",
  ],
];

const SchoolTicker = () => {
  const { isMobile } = useDevice();

  return (
    <div className="py-20 bg-base-100 border-y border-base-200/50">
      <div className="text-center mb-10">
        <span className="text-sm font-bold tracking-widest text-primary/80 uppercase">
          Trusted Partners
        </span>
        <h2 className="mt-2 text-2xl font-bold">26 所高中職聯合發起</h2>
      </div>
      <div className="space-y-8 mask-linear-fade">
        {schoolIconFileNames.map((icons, index) => (
          <Marquee
            key={index}
            speed={50}
            direction={index % 2 === 0 ? "left" : "right"}
            elements={icons.map((iconName) => (
              <div key={iconName} className="px-4">
                <LazyLoadImage
                  className={schoolIconClassName(isMobile)}
                  src={`https://image.cooperativeshops.org/${iconName}`}
                  alt="School Logo"
                  effect="opacity"
                />
              </div>
            ))}
          ></Marquee>
        ))}
      </div>
    </div>
  );
};

const NarrativeScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const words = [
    { text: "告別", highlight: false },
    { text: "容易遺失的", highlight: false },
    { text: "實體學生證", highlight: true },
    { text: "擁抱", highlight: false },
    { text: "更便利的", highlight: false },
    { text: "數位生活", highlight: true },
  ];

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-base-200">
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="max-w-4xl px-6 w-full">
          <motion.div className="flex flex-wrap justify-center content-center gap-x-2 gap-y-2 lg:gap-x-8 lg:gap-y-4">
            {words.map((word, i) => {
              const start = i / words.length;
              const end = (i + 1) / (words.length + 1);

              const opacity = useTransform(
                scrollYProgress,
                [start, end],
                [0.1, 1]
              );
              const y = useTransform(scrollYProgress, [start, end], [20, 0]);
              const blur = useTransform(scrollYProgress, [start, end], [10, 0]);
              const filter = useMotionTemplate`blur(${blur}px)`;

              return (
                <motion.span
                  key={i}
                  style={{ opacity, y, filter }}
                  className={`text-4xl lg:text-7xl font-bold transition-colors duration-300 ${
                    word.highlight
                      ? i === 2
                        ? "text-error line-through decoration-4 decoration-error/80"
                        : "text-success"
                      : "text-base-content"
                  }`}
                >
                  {word.text}
                </motion.span>
              );
            })}
          </motion.div>

          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0.7, 0.9], [0, 1]),
            }}
            className="text-center mt-12"
          >
            <p className="text-xl text-base-content/60">
              Google 帳號一鍵登入，QR Code 即時認證
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const getSchoolAbbr = (filename: string) => {
  return filename.split(".")[0].toUpperCase();
};

const CardReplacementAnimation = () => {
  const { isMobile } = useDevice();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 1. 只取最後 10 張卡片以優化性能
  // 注意：需確保 schoolIconFileNames 已在外部定義或透過 props 傳入
  // 這裡假設 allSchoolIcons 是扁平化後的陣列
  const visibleCardsCount = 8;

  const cardsConfig = useMemo(() => {
    const flatIcons = schoolIconFileNames
      .flat()
      .filter((n) => n != "kmsh.gif")
      .concat(["kmsh.gif"]);
    const slicedIcons = flatIcons.slice(-visibleCardsCount);

    return slicedIcons.map((icon, index) => {
      // 決定飛入方向：左(-1)、中(0)、右(1)
      let direction = Math.random() < 0.33 ? -1 : Math.random() < 0.66 ? 0 : 1;
      if (isMobile) {
        direction = Math.random() < 0.5 ? -1 : 1; // For better look on mobile
      }
      // 根據方向設定起始 X 位置 (螢幕外)
      const startX = direction * 1000; // 1000px 應該足夠移出視窗

      return {
        icon,
        id: index,
        // 最終靜止時的微調 (不規則堆疊)
        endRotate: Math.random() * 20 - 10,
        endX: Math.random() * 40 - 20,
        endY: Math.random() * 40 - 20,
        // 起始位置
        startX,
      };
    });
  }, []);

  // --- 動畫時間軸規劃 (總長 0 ~ 1) ---
  // 0.00 ~ 0.60: 卡片飛入階段 (Chaos Fly-in)
  // 0.60 ~ 0.75: 停滯階段 (The Hold) - 讓使用者看清堆疊
  // 0.75 ~ 0.90: 轉換階段 (Transformation) - 變為統一卡片

  const flyInEnd = 0.6;
  const holdEnd = 0.75;
  const exitEnd = 0.9;

  // --- 文字動畫 ---

  // 文字 1: "26種樣式" (在飛入期顯示，停滯期開始消失)
  const textOpacity1 = useTransform(
    scrollYProgress,
    [0, 0.1, flyInEnd, flyInEnd + 0.05],
    [0, 1, 1, 0]
  );
  const textY1 = useTransform(
    scrollYProgress,
    [0, 0.1, flyInEnd + 0.05],
    [20, 0, -20]
  );

  // 文字 2: "一個身份" (在轉換期顯示)
  const textOpacity2 = useTransform(
    scrollYProgress,
    [holdEnd, holdEnd + 0.1],
    [0, 1]
  );
  const textY2 = useTransform(
    scrollYProgress,
    [holdEnd, holdEnd + 0.1],
    [20, 0]
  );

  // --- 統一卡片 (Hero Card) 動畫 ---
  // 在 holdEnd 之後才開始出現
  const finalCardScale = useTransform(
    scrollYProgress,
    [holdEnd, exitEnd],
    [0.8, 1]
  );
  const finalCardOpacity = useTransform(
    scrollYProgress,
    [holdEnd, holdEnd + 0.05],
    [0, 1]
  );

  // --- 堆疊卡片組的整體退場 ---
  const stackScale = useTransform(
    scrollYProgress,
    [holdEnd, exitEnd],
    [1, 0.5]
  );
  const stackOpacity = useTransform(
    scrollYProgress,
    [holdEnd + 0.05, exitEnd],
    [1, 0]
  );

  return (
    <section ref={containerRef} className="relative h-[450vh] bg-base-200">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* 文字層 */}
        <div className="absolute top-[15%] w-full text-center z-30 px-4 pointer-events-none">
          <motion.div
            style={{ opacity: textOpacity1, y: textY1 }}
            className="absolute inset-x-0 top-0"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-sm">
              26 所學校，26 種樣式
            </h2>
            <p className="text-xl text-base-content/60">
              傳統學生證辨識不易，
              <br className="md:hidden" />
              店家給予優惠常常受阻。
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: textOpacity2, y: textY2 }}
            className="absolute inset-x-0 top-0"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 drop-shadow-sm">
              一個身份，全台南通用
            </h2>
            <p className="text-xl text-base-content/60">
              統一視覺識別，掃描即驗證。
              <br className="md:hidden" />
              讓優惠像呼吸一樣自然。
            </p>
          </motion.div>
        </div>

        {/* 卡片動畫容器 */}
        <div className="relative w-full max-w-md aspect-[1.58/1] flex items-center justify-center">
          {/* 1. 混亂堆疊 (The Chaos Stack) */}
          <motion.div
            style={{ scale: stackScale, opacity: stackOpacity }}
            className="absolute inset-0 z-10 perspective-1000"
          >
            {cardsConfig.map((card, i) => {
              // 計算每張卡片的個人時間軸
              // 總共 15 張，分配在 0 ~ 0.6 的區間
              const step = flyInEnd / visibleCardsCount;
              const start = i * step;
              const end = start + 0.2; // 縮短單張飛行時間，讓動作更俐落

              // 1. 透明度：快速顯現 (解決問題 1)
              // 在動畫開始的前 20% 時間內就變為不透明
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const opacity = useTransform(
                scrollYProgress,
                [start, start + 0.05],
                [0, 1]
              );

              // 2. 縮放：從 3 倍大飛入 (稍微減小倍率以免穿幫)
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const scale = useTransform(scrollYProgress, [start, end], [3, 1]);

              // 3. 位移：從左/中/右飛入 (解決問題 4)
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const x = useTransform(
                scrollYProgress,
                [start, end],
                [card.startX, card.endX]
              );
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const y = useTransform(
                scrollYProgress,
                [start, end],
                [100, card.endY]
              ); // Y 軸稍微從下方往上

              // 旋轉
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const rotate = useTransform(
                scrollYProgress,
                [start, end],
                [card.endRotate * 3, card.endRotate]
              );

              return (
                <motion.div
                  key={card.id}
                  style={{
                    scale,
                    opacity,
                    x,
                    y,
                    rotate,
                    zIndex: i,
                  }}
                  className="absolute inset-0"
                >
                  <div className="w-full h-full rounded-box border border-base-content/10 shadow-xl flex flex-col p-6 justify-between overflow-hidden relative bg-base-100">
                    {/* 內容 */}
                    <div className="relative z-10 flex justify-between items-start">
                      <img
                        src={`https://image.cooperativeshops.org/${card.icon}`}
                        alt="School Logo"
                        className="w-16 h-16 object-contain rounded-lg bg-white/50 p-1"
                      />
                      <div className="w-16 h-4 bg-base-content/20 rounded-full" />
                    </div>
                    <div className="relative z-10">
                      <div className="text-xs font-mono opacity-50 mb-1">
                        STUDENT ID
                      </div>
                      <div className="text-2xl font-black opacity-90 tracking-widest text-base-content">
                        {getSchoolAbbr(card.icon)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* 2. 統一 Card (The Unified Solution) */}
          <motion.div
            style={{ scale: finalCardScale, opacity: finalCardOpacity }}
            className="absolute inset-0 z-20"
          >
            <div className="absolute -inset-6">
              {/* 光暈 */}
              <div className="absolute inset-6 -m-1 bg-gradient-to-r from-primary/60 to-secondary/60 opacity-30 blur-lg rounded-box" />

              {/* 卡片本體 */}
              <div className="absolute inset-6 rounded-box border border-base-300 backdrop-blur-xl overflow-hidden group">
                <div className="absolute inset-0 bg-base-100" />
                {/* 其餘內容 */}
              </div>
            </div>

            <div className="relative w-full h-full rounded-box border border-base-300 backdrop-blur-xl overflow-hidden group">
              <div className="absolute inset-0 bg-base-100" />

              <div className="relative p-6 h-full flex flex-col justify-between text-base-content">
                <div className="flex justify-between items-start">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="w-16 h-16 rounded-2xl shadow-md bg-base-100"
                  />
                  <ScanLine className="w-8 h-8 opacity-50" />
                </div>
                <div>
                  <div className="font-mono text-sm opacity-50 mb-1">
                    2026 COOPERATIVE
                  </div>
                  <div className="text-2xl font-bold tracking-widest uppercase">
                    GAGAGA
                  </div>
                </div>
                <div className="flex justify-between items-end font-mono text-xs opacity-50">
                  <span>TAINAN UNION</span>
                  <span>VERIFIED</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FeatureGrid = () => {
  return (
    <section className="py-24 px-4 bg-base-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            簡單三步，立即享受
          </h2>
          <p className="text-base-content/60">無須繁瑣註冊，使用學校帳號即可</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="card bg-base-200/50 border border-base-200 hover:border-primary/50 transition-colors p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-6">
              <School className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">1. 選擇學校</h3>
            <p className="text-base-content/60">
              支援台南 26 所高中職，選擇你的學校並使用 Google 帳號登入。
            </p>
          </div>

          {/* Card 2 */}
          <div className="card bg-base-200/50 border border-base-200 hover:border-primary/50 transition-colors p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* 連接線示意 (Desktop only) */}
            <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-[2px] bg-base-300" />

            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center mb-6">
              <Smartphone className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">2. 獲取憑證</h3>
            <p className="text-base-content/60">
              系統將自動生成你的專屬 QR Code，這就是你的數位學生證。
            </p>
          </div>

          {/* Card 3 */}
          <div className="card bg-base-200/50 border border-base-200 hover:border-primary/50 transition-colors p-8 flex flex-col items-center text-center relative">
            <div className="hidden md:block absolute top-1/2 -left-4 w-8 h-[2px] bg-base-300" />

            <div className="w-16 h-16 rounded-2xl bg-green-600/10 text-green-600 flex items-center justify-center mb-6">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">3. 結帳出示</h3>
            <p className="text-base-content/60">
              在合作店家結帳時出示 QR Code，店家掃描後即享優惠。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-32 bg-base-100 relative overflow-hidden">
      {/* 背景圓圈裝飾 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-base-content/5 rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-base-content/5 rounded-full" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl lg:text-6xl font-bold mb-6">即刻開始</h2>
        <p className="text-xl text-base-content/60 mb-10 max-w-2xl mx-auto">
          加入數萬名台南高中生的行列，探索城市中的專屬優惠。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/choose-school"
            className="btn btn-primary btn-lg rounded-full px-12 text-lg"
          >
            立即綁定帳號
            <ArrowRight className="w-5 h-5 ml-1" />
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-base-content/40 font-mono">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 免費使用
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 安全認證
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 持續更新
          </span>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-base-100 border-t border-base-200">
      <div className="container mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col flex-1 gap-2">
            <div className="flex items-center gap-2 opacity-80">
              <img src={Logo} alt="Logo" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-sm tracking-widest uppercase">
                Cooperative Shops
              </span>
            </div>
            <p className="text-xs text-base-content/40 mt-2">
              © 2026 嘎嘎嘎. All rights reserved.
            </p>
          </div>

          {/* Links - Mobile: Vertical Left, Desktop: Horizontal */}
          <div className="flex flex-col flex-2 justify-center md:flex-row gap-6 md:gap-8 text-sm text-base-content/60 font-medium">
            <Link to="/home" className="hover:text-primary transition-colors">
              QR Code
            </Link>
            <Link
              to="/schools"
              className="hover:text-primary transition-colors"
            >
              合作校
            </Link>
            <Link to="/shops" className="hover:text-primary transition-colors">
              合作商家
            </Link>
            <Link
              to="/qr-scanner"
              className="hover:text-primary transition-colors"
            >
              店家掃描
            </Link>
            <a
              href="/privacy-policy.html"
              className="hover:text-primary transition-colors"
            >
              隱私政策
            </a>
          </div>

          {/* Social */}
          <div className="flex flex-1 justify-end gap-4">
            <a
              href="https://www.instagram.com/cooperativeshops_2026/"
              target="_blank"
              className="opacity-40 hover:opacity-100 transition-opacity"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/haner0834/CooperativeShop"
              target="_blank"
              className="opacity-40 hover:opacity-100 transition-opacity"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="w-full bg-base-300 px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex items-center gap-2 opacity-80">
            <Frog className="w-12 h-12 rounded-2xl border border-black/20" />
            <div className="flex flex-col">
              <span className="text-xs opacity-70">created by</span>
              <p className="text-lg font-bold">嘎嘎嘎</p>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-80">
            <div className="w-12 h-12 rounded-2xl bg-base-100 border  border-black/20">
              <p className="flex items-center justify-center text-2xl h-full animate-ping">
                🍔
              </p>
            </div>
            <div className="flex flex-col">
              <span className="text-xs opacity-70">supported by</span>
              <p className="text-lg font-bold animate-spin">蕭言翰</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
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

    setNavbarButtons([...baseButtons]);
  }, [setNavbarButtons]);

  return (
    <>
      <PageMeta {...routesMeta.intro} />
      <link rel="canonical" href="https://cooperativeshops.org/" />

      <main className="w-full bg-base-100 selection:bg-primary selection:text-base-100 pt-18">
        <Hero />
        <SchoolTicker />
        <NarrativeScroll />
        <CardReplacementAnimation />
        <FeatureGrid />
        <CTA />
        <Footer />
      </main>
    </>
  );
};

export default Intro;
