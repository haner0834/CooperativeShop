import React from 'react';
import FrogUrl from '@shared/icons/frog.jpeg';
import GithubIcon from '@shared/icons/github.svg?react';
import GoogleUrl from '@shared/icons/google.png';
import InstagramIcon from '@shared/icons/instagram.svg?react';


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
