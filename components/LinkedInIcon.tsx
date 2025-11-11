"use client";

import React from "react";

interface LinkedInIconProps extends React.SVGProps<SVGSVGElement> {
  id: string;
  size?: number;
}

export default function LinkedInIcon({
  id,
  size = 24,
  className = "",
  ...props
}: LinkedInIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      {...props}
      aria-hidden="true"
      role="none"
    >
      <use href={`#${id}`} />
    </svg>
  );
}
