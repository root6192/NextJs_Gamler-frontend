import Image from 'next/image';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src?: string | null;
  initials?: string;
  alt?: string;
  className?: string;
  isSquare?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Avatar = ({
  src = null,
  isSquare = false,
  size = 'md',
  initials,
  alt = '',
  className,
  ...props
}: AvatarProps & React.ComponentPropsWithoutRef<'span'>) => {
  return (
    <span
      data-slot='avatar'
      {...props}
      className={twMerge(
        'outline-fg/(--ring-opacity) inline-grid shrink-0 align-middle outline-1 -outline-offset-1 [--avatar-radius:20%] [--ring-opacity:20%] *:col-start-1 *:row-start-1',
        size === 'xs' && 'size-5',
        size === 'sm' && 'size-6',
        size === 'md' && 'size-8',
        size === 'lg' && 'size-10',
        size === 'xl' && 'size-12',
        isSquare ? 'rounded-(--avatar-radius) *:rounded-(--avatar-radius)' : 'rounded-full *:rounded-full',
        className,
      )}>
      {initials && (
        <svg
          className='font-md size-full fill-current p-[5%] text-[48px] uppercase select-none'
          viewBox='0 0 100 100'
          aria-hidden={alt ? undefined : 'true'}>
          {alt && <title>{alt}</title>}
          <text x='50%' y='50%' alignmentBaseline='middle' dominantBaseline='middle' textAnchor='middle' dy='.125em'>
            {initials}
          </text>
        </svg>
      )}
      {src && (
        <Image className='size-full object-cover object-center' src={src} alt={alt} width={100} height={100} priority={false} loading='lazy' />
      )}
    </span>
  );
};

export { Avatar };
export type { AvatarProps };
