interface PageMetaProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

const defaultMeta: Required<PageMetaProps> = {
  title: "南校聯合特約",
  description: "台南 26 所高中聯合舉辦，結合 QR Code 實現數位化。",
  url: "https://cooperativeshops.org/",
  image: "https://cooperativeshops.org/logo-vertical.png",
};

const PageMeta = ({ title, description, url, image }: PageMetaProps) => {
  const meta = {
    title: title || defaultMeta.title,
    description: description || defaultMeta.description,
    url: url || defaultMeta.url,
    image: image || defaultMeta.image,
  };

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:image" content={meta.image} />
    </>
  );
};

export interface RouteMetaConfig {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export const routesMeta = {
  root: {
    title: "南校聯合特約",
    description: "台南 26 所高中聯合舉辦，結合 QR Code 實現數位化。",
    url: "https://cooperativeshops.org/",
  },
  intro: {
    title: "歡迎 | 南校聯合特約",
    description:
      "台南 26 所高中聯合舉辦，整合商家、美食地圖、學校、電子憑證等資訊。",
    url: "https://cooperativeshops.org/intro",
  },
  chooseSchool: {
    title: "登入 | 選擇學校",
    description: "登入南校聯合特約，即可享有專屬優惠。",
    url: "https://cooperativeshops.org/choose-school",
  },
  shops: {
    title: "特約商店 | 南校聯合特約",
    description:
      "彙整南校聯合特約的所有合作商店，提供優惠資訊、使用說明與最新更新。",
    url: "https://cooperativeshops.org/shops",
  },
  schools: {
    title: "合作校列表 | 南校聯合特約",
    description: "瀏覽南校聯合特約 26 所高中職。",
    url: "https://cooperativeshops.org/schools",
  },
  qrScanner: {
    title: "QR 掃描驗證 | 南校聯合特約",
    description: "掃描 QR code，立即驗證身份",
    url: "https://cooperativeshops.org/qr-scanner",
  },
  /** /login */
  login: {
    title: "登入 | 南校聯合特約",
    description: "登入南校聯合特約，使用 Google 或學校帳號享有學生專屬優惠。",
    url: "https://cooperativeshops.org/login",
  },

  /** /login-hint */
  loginHint: {
    title: "登入說明 | 南校聯合特約",
    description: "依據所屬學校，查看可使用的登入方式與注意事項。",
    url: "https://cooperativeshops.org/login-hint",
  },

  /** /login-failed */
  loginFailed: {
    title: "登入失敗 | 南校聯合特約",
    description: "登入未成功，請重新嘗試或確認登入方式是否正確。",
    url: "https://cooperativeshops.org/login-failed",
  },

  /** /qr-verification */
  qrVerification: {
    title: "QR 驗證 | 南校聯合特約",
    description: "驗證使用者 QR Code 身份，確認特約資格與使用狀態。",
    url: "https://cooperativeshops.org/qr-verification",
  },

  /** /home */
  home: {
    title: "首頁 | 南校聯合特約",
    description: "快速查看可用的特約優惠、商店資訊與個人狀態。",
    url: "https://cooperativeshops.org/home",
  },

  /** /faq */
  faq: {
    title: "常見問題 | 南校聯合特約",
    description: "關於南校聯合特約的使用方式、資格、登入與優惠相關常見問題。",
    url: "https://cooperativeshops.org/faq",
  },

  /** /shops/map */
  shopsMap: {
    title: "商店地圖 | 南校聯合特約",
    description: "以地圖方式瀏覽南校聯合特約的合作商店位置。",
    url: "https://cooperativeshops.org/shops/map",
  },

  /** /shops/:id */
  shopDetail: (shopName: string, image: string) => ({
    title: `${shopName} | 特約商店 | 南校聯合特約`,
    description: `查看 ${shopName} 的特約優惠內容、使用方式與相關說明。`,
    url: "https://cooperativeshops.org/shops",
    image,
  }),

  /** /schools/:abbr */
  schoolDetail: (schoolName: string) => ({
    title: `${schoolName} | 合作學校 | 南校聯合特約`,
    description: `查看 ${schoolName} 參與南校聯合特約的相關資訊與可用優惠。`,
    url: "https://cooperativeshops.org/schools",
  }),

  accountCenter: {
    title: "帳號中心 | 南校聯合特約",
    description: "查看帳號內容、管理設備與登入帳號。",
    url: "https://cooperativeshops.org/account-center",
  },
} as const;

export default PageMeta;
