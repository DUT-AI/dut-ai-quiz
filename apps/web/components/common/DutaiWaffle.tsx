'use client';

import React from 'react';
import Script from 'next/script';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dutai-waffle': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { current?: string },
        HTMLElement
      >;
    }
  }
}

interface DutaiWaffleProps {
  current?: 'manage' | 'lms' | 'meetly' | 'data' | string;
}

export function DutaiWaffle({ current = 'lms' }: DutaiWaffleProps) {
  return (
    <>
      <Script
        src="https://workspace.dutai.io.vn/waffle.js"
        strategy="lazyOnload"
      />
      {/* @ts-ignore Custom Web Component */}
      <dutai-waffle current={current} />
    </>
  );
}

export default DutaiWaffle;
