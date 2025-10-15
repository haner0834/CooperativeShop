import {
  Bmsh,
  Ccsh,
  Cjshs,
  Dwsh,
  Hhsh,
  Hhvs,
  Hkhs,
  Hyivs,
  Hysh,
  Kmsh,
  Lmsh,
  Mdsh,
  Nkhs,
  Nnkieh,
  Nnsh,
  Pmai,
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
import type { ComponentType } from "react";

const schoolIcons: ComponentType<{ className?: string }>[] = [
  Bmsh,
  Ccsh,
  Cjshs,
  Dwsh,
  Hhsh,
  Hhvs,
  Hkhs,
  Hyivs,
  Hysh,
  Kmsh,
  Lmsh,
  Mdsh,
  Nkhs,
  Nnkieh,
  Nnsh,
  Pmai,
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
];

const schoolNames = [
  "Bmsh",
  "Ccsh",
  "Cjshs",
  "Dwsh",
  "Hhsh",
  "Hhvs",
  "Hkhs",
  "Hyivs",
  "Hysh",
  "Kmsh",
  "Lmsh",
  "Mdsh",
  "Nkhs",
  "Nnkieh",
  "Nnsh",
  "Pmai",
  "Sfsh",
  "Tcjh",
  "Tncvs",
  "Tnssh",
  "Tntcshsa",
  "Tnvs",
  "Twais",
  "Twvs",
  "Yhsh",
  "Yrhs",
].map((e) => e.toLowerCase());

const map = schoolNames.reduce((acc, key, index) => {
  acc[key] = schoolIcons[index];
  return acc;
}, {} as Record<string, ComponentType<{ className?: string }>>);

const SchoolIcon = ({
  abbreviation,
  className,
}: {
  abbreviation: string;
  className?: string;
}) => {
  const Icon = map[abbreviation.toLowerCase()];
  if (Icon) {
    return <Icon className={className} />;
  } else {
    return <p className="font-bold text-error">You spelled it wrong bruh</p>;
  }
};

export default SchoolIcon;
