import React from 'react';
import ArrowDownIcon from '@shared/icons/arrow-down.svg?react';
import CalendarIcon from '@shared/icons/calendar.svg?react';
import CameraOffIcon from '@shared/icons/camera-off.svg?react';
import CameraIcon from '@shared/icons/camera.svg?react';
import CheckIcon from '@shared/icons/check.svg?react';
import ChevronLeftIcon from '@shared/icons/chevron-left.svg?react';
import CircleQuestionMarkIcon from '@shared/icons/circle-question-mark.svg?react';
import EyeOffIcon from '@shared/icons/eye-off.svg?react';
import EyeIcon from '@shared/icons/eye.svg?react';
import GithubIcon from '@shared/icons/github.svg?react';
import GlobeIcon from '@shared/icons/globe.svg?react';
import HomeIcon from '@shared/icons/home.svg?react';
import IdCardIcon from '@shared/icons/id-card.svg?react';
import InstagramIcon from '@shared/icons/instagram.svg?react';
import MailIcon from '@shared/icons/mail.svg?react';
import MenuIcon from '@shared/icons/menu.svg?react';
import MoveRightIcon from '@shared/icons/move-right.svg?react';
import QrCodeIcon from '@shared/icons/qr-code.svg?react';
import ScanLineIcon from '@shared/icons/scan-line.svg?react';
import ScanIcon from '@shared/icons/scan.svg?react';
import SchoolIcon from '@shared/icons/school.svg?react';
import ShieldCheckIcon from '@shared/icons/shield-check.svg?react';
import SquareArrowOutUpRightIcon from '@shared/icons/square-arrow-out-up-right.svg?react';


export const ArrowDown = (props: React.SVGProps<SVGSVGElement>) => {
  return <ArrowDownIcon {...props} />;
};


export const Bmsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/bmsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Bmsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Calendar = (props: React.SVGProps<SVGSVGElement>) => {
  return <CalendarIcon {...props} />;
};


export const CameraOff = (props: React.SVGProps<SVGSVGElement>) => {
  return <CameraOffIcon {...props} />;
};


export const Camera = (props: React.SVGProps<SVGSVGElement>) => {
  return <CameraIcon {...props} />;
};


export const Ccsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/ccsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Ccsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Check = (props: React.SVGProps<SVGSVGElement>) => {
  return <CheckIcon {...props} />;
};


export const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => {
  return <ChevronLeftIcon {...props} />;
};


export const CircleQuestionMark = (props: React.SVGProps<SVGSVGElement>) => {
  return <CircleQuestionMarkIcon {...props} />;
};


export const Cjshs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/cjshs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Cjshs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Dwsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/dwsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Dwsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const EyeOff = (props: React.SVGProps<SVGSVGElement>) => {
  return <EyeOffIcon {...props} />;
};


export const Eye = (props: React.SVGProps<SVGSVGElement>) => {
  return <EyeIcon {...props} />;
};


export const Frog = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/frog.jpeg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Frog";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Github = (props: React.SVGProps<SVGSVGElement>) => {
  return <GithubIcon {...props} />;
};


export const Globe = (props: React.SVGProps<SVGSVGElement>) => {
  return <GlobeIcon {...props} />;
};


export const Google = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/google.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Google";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Hhsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/hhsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Hhsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Hhvs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/hhvs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Hhvs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Hkhs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/hkhs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Hkhs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Home = (props: React.SVGProps<SVGSVGElement>) => {
  return <HomeIcon {...props} />;
};


export const Hyivs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/hyivs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Hyivs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Hysh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/hysh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Hysh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const IdCard = (props: React.SVGProps<SVGSVGElement>) => {
  return <IdCardIcon {...props} />;
};


export const Instagram = (props: React.SVGProps<SVGSVGElement>) => {
  return <InstagramIcon {...props} />;
};


export const Kmsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/kmsh.gif').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Kmsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Lmsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/lmsh.jpg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Lmsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Mail = (props: React.SVGProps<SVGSVGElement>) => {
  return <MailIcon {...props} />;
};


export const Mdsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/mdsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Mdsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Menu = (props: React.SVGProps<SVGSVGElement>) => {
  return <MenuIcon {...props} />;
};


export const MoveRight = (props: React.SVGProps<SVGSVGElement>) => {
  return <MoveRightIcon {...props} />;
};


export const Nkhs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/nkhs.jpeg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Nkhs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Nnkieh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/nnkieh.jpg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Nnkieh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Nnsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/nnsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Nnsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Pmai = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/pmai.jpg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Pmai";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const QrCode = (props: React.SVGProps<SVGSVGElement>) => {
  return <QrCodeIcon {...props} />;
};


export const ScanLine = (props: React.SVGProps<SVGSVGElement>) => {
  return <ScanLineIcon {...props} />;
};


export const Scan = (props: React.SVGProps<SVGSVGElement>) => {
  return <ScanIcon {...props} />;
};


export const School = (props: React.SVGProps<SVGSVGElement>) => {
  return <SchoolIcon {...props} />;
};


export const Sfsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/sfsh.gif').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Sfsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const ShieldCheck = (props: React.SVGProps<SVGSVGElement>) => {
  return <ShieldCheckIcon {...props} />;
};


export const SquareArrowOutUpRight = (props: React.SVGProps<SVGSVGElement>) => {
  return <SquareArrowOutUpRightIcon {...props} />;
};


export const Tcjh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/tcjh.jpeg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Tcjh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Tncvs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/tncvs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Tncvs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Tnssh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/tnssh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Tnssh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Tntcshsa = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/tntcshsa.gif').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Tntcshsa";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Tnvs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/tnvs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Tnvs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Twais = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/twais.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Twais";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Twvs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/twvs.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Twvs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Yhsh = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/yhsh.png').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Yhsh";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};


export const Yrhs = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const Comp = React.lazy(() =>
    import('@shared/icons/yrhs.jpg').then(mod => {
      const ImgComp = (p: React.ImgHTMLAttributes<HTMLImageElement>) => <img src={mod.default} {...p} />;
      ImgComp.displayName = "Yrhs";
      return { default: ImgComp };
    })
  );
  return (
    <React.Suspense fallback={null}>
      <Comp {...props} />
    </React.Suspense>
  );
};
