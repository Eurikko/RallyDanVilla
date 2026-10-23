import React from 'react';
import { BrandMark, BrandMarkProps } from './BrandMark';

export interface VolleyballLogoProps extends BrandMarkProps {}

export const VolleyballLogo: React.FC<VolleyballLogoProps> = (props) => {
  return <BrandMark {...props} />;
};
