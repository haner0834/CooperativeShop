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

export const routesMeta: Record<string, RouteMetaConfig> = {
  root: {
    title: "南校聯合特約",
    description: "台南 26 所高中聯合舉辦，結合 QR Code 實現數位化。",
    url: "https://cooperativeshops.org/",
  },
  intro: {
    title: "歡迎 - 南校聯合特約",
    description:
      "台南 26 所高中聯合舉辦，整合商家、美食地圖、學校、電子憑證等資訊。",
    url: "https://cooperativeshops.org/intro",
  },
  chooseSchool: {
    title: "登入 - 選擇學校",
    description: "登入南校聯合特約，即可享有專屬優惠。",
    url: "https://cooperativeshops.org/choose-school",
  },
  shops: {
    title: "特約商店列表",
    description: "瀏覽台南 26 所高中聯合特約的所有商店與優惠資訊。",
    url: "https://cooperativeshops.org/shops",
  },
  schools: {
    title: "合作校列表",
    description: "瀏覽南校聯合特約 26 所高中職。",
    url: "https://cooperativeshops.org/schools",
  },
  qrScanner: {
    title: "QR 掃描驗證",
    description: "掃描 QR code，立即驗證身份",
    url: "https://cooperativeshops.org/qr-scanner",
  },
} as const;

export default PageMeta;
