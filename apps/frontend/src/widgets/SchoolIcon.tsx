import { LazyLoadImage } from "react-lazy-load-image-component";

const schoolIconFileNameMap: Record<string, string> = {
  // Key is the component name prefix, value is the full filename from the image
  bmsh: "bmsh.png",
  ccsh: "ccsh.png",
  cjshs: "cjshs.png",
  dwsh: "dwsh.png",
  hhsh: "hhsh.png",
  hhvs: "hhvs.png",
  hkhs: "hkhs.png",
  hyivs: "hyivs.png",
  hysh: "hysh.png",
  kmsh: "kmsh.gif",
  lmsh: "lmsh.jpg",
  mdsh: "mdsh.png",
  nkhs: "nkhs.jpeg",
  nnkieh: "nnkieh.jpg",
  nnsh: "nnsh.png",
  pmai: "pmai.jpg",
  sfsh: "sfsh.gif",
  tcjh: "tcjh.jpeg",
  tncvs: "tncvs.png",
  tnssh: "tnssh.png",
  tntcshsa: "tntcshsa.gif",
  tnvs: "tnvs.png",
  twais: "twais.png",
  twvs: "twvs.png",
  yhsh: "yhsh.png",
  yrhs: "yrhs.jpg",
};

const SchoolIcon = ({
  abbreviation,
  className,
}: {
  abbreviation: string;
  className?: string;
}) => {
  const fileName = schoolIconFileNameMap[abbreviation];
  if (fileName) {
    return (
      <LazyLoadImage
        className={className}
        src={`https://image.cooperativeshops.org/${fileName}`}
      ></LazyLoadImage>
    );
  } else {
    return <p className="font-bold text-error">You spelled it wrong bruh</p>;
  }
};

export default SchoolIcon;
