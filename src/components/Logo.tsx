import React from 'react';
import LogoSvg from '../../static/img/logo.svg';

export default function Logo(props: React.ComponentProps<'svg'>) {
  return (
    <LogoSvg {...props} style={{ color: 'currentColor', ...props.style }} />
  );
}
