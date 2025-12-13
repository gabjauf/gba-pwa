import type { ComponentProps } from 'react';

type SvgProps = Omit<ComponentProps<'svg'>, 'children'>;

const baseSvgProps: SvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  width: '1em',
  height: '1em',
  'aria-hidden': true,
  focusable: false,
};

export const IconPlay = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path d="M8 5v14l12-7-12-7z" fill="currentColor" />
  </svg>
);

export const IconPause = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
  </svg>
);

export const IconRotateCcw = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path
      d="M3 12a9 9 0 1 0 3-6.7"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M3 4v5h5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const IconStop = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
  </svg>
);

export const IconSave = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path
      d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M17 21v-8H7v8"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M7 3v5h8"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const IconFolderOpen = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path
      d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H3V7z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M3 10h18l-2 9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export const IconGamepad = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path
      d="M7 10h10a5 5 0 0 1 4.6 3.1l1.1 2.6a3 3 0 0 1-2.8 4.3h-.6a2 2 0 0 1-1.6-.8l-1.2-1.6a2 2 0 0 0-1.6-.8H9.1a2 2 0 0 0-1.6.8l-1.2 1.6a2 2 0 0 1-1.6.8h-.6a3 3 0 0 1-2.8-4.3l1.1-2.6A5 5 0 0 1 7 10z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M8.5 14.5h3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M10 13v3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M16.6 14.4h.01"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
    <path
      d="M18.4 15.6h.01"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
    />
  </svg>
);

export const IconFastForward = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path d="M4 6v12l8-6-8-6z" fill="currentColor" />
    <path d="M12 6v12l8-6-8-6z" fill="currentColor" />
  </svg>
);

export const IconRewind = (props: SvgProps) => (
  <svg {...baseSvgProps} {...props}>
    <path d="M20 6v12l-8-6 8-6z" fill="currentColor" />
    <path d="M12 6v12L4 12l8-6z" fill="currentColor" />
  </svg>
);

export type DPadArrowDirection = 'up' | 'down' | 'left' | 'right';

export const IconDPadArrow = ({ direction, ...props }: SvgProps & { direction: DPadArrowDirection }) => {
  const rotation = direction === 'up' ? 0 : direction === 'right' ? 90 : direction === 'down' ? 180 : 270;
  return (
    <svg {...baseSvgProps} {...props}>
      <g transform={`rotate(${rotation} 12 12)`}>
        <path d="M12 6l7 8H5l7-8z" fill="currentColor" />
      </g>
    </svg>
  );
};
