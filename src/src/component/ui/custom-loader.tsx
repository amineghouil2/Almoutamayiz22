import { cn } from '@/lib/utils';

const CustomLoader = ({
  className,
  ...props
}: React.HTMLAttributes<SVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('animate-spinner-ease-spin', className)}
      {...props}
    >
      <g>
        <rect x="11" y="2" width="2" height="5" rx="1" opacity="0.1" />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.2"
          transform="rotate(30 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.3"
          transform="rotate(60 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.4"
          transform="rotate(90 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.5"
          transform="rotate(120 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.6"
          transform="rotate(150 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.7"
          transform="rotate(180 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.8"
          transform="rotate(210 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0.9"
          transform="rotate(240 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="1"
          transform="rotate(270 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0"
          transform="rotate(300 12 12)"
        />
        <rect
          x="11"
          y="2"
          width="2"
          height="5"
          rx="1"
          opacity="0"
          transform="rotate(330 12 12)"
        />
      </g>
    </svg>
  );
};

export default CustomLoader;
