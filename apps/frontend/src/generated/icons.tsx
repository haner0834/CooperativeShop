import React from 'react';
import WangAvatarUrl from '@shared/icons/WangAvatar.jpg';
import FacebookIcon from '@shared/icons/facebook.svg?react';
import FrogUrl from '@shared/icons/frog.jpeg';
import GithubIcon from '@shared/icons/github.svg?react';
import GoogleUrl from '@shared/icons/google.png';
import InstagramIcon from '@shared/icons/instagram.svg?react';
import LineIcon from '@shared/icons/line.svg?react';
import MidFingerUrl from '@shared/icons/mid-finger.jpg';
import TintedInstagramUrl from '@shared/icons/tinted-instagram.png';


export const WangAvatar = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return <img src={WangAvatarUrl} {...props} />;
};


export const Facebook = (props: React.SVGProps<SVGSVGElement>) => {
  return <FacebookIcon {...props} />;
};


export const Frog = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return <img src={FrogUrl} {...props} />;
};


export const Github = (props: React.SVGProps<SVGSVGElement>) => {
  return <GithubIcon {...props} />;
};


export const Google = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return <img src={GoogleUrl} {...props} />;
};


export const Instagram = (props: React.SVGProps<SVGSVGElement>) => {
  return <InstagramIcon {...props} />;
};


export const Line = (props: React.SVGProps<SVGSVGElement>) => {
  return <LineIcon {...props} />;
};


export const MidFinger = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return <img src={MidFingerUrl} {...props} />;
};


export const TintedInstagram = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  return <img src={TintedInstagramUrl} {...props} />;
};
