import React from 'react';

export const AmbientBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#24100a]"
    >
      {/* Top-right warm clay orb (#8c432c) */}
      <div
        className="animate-orb-1 absolute -top-32 -right-28 w-[520px] h-[520px] rounded-full opacity-55 blur-[110px]"
        style={{ backgroundColor: '#8c432c' }}
      />

      {/* Mid-left copper glow orb (#b87333) */}
      <div
        className="animate-orb-2 absolute top-1/3 -left-32 w-[460px] h-[460px] rounded-full opacity-40 blur-[120px]"
        style={{ backgroundColor: '#b87333' }}
      />

      {/* Bottom-center deep brown orb (#522416) */}
      <div
        className="animate-orb-3 absolute -bottom-36 right-1/4 w-[600px] h-[600px] rounded-full opacity-70 blur-[120px]"
        style={{ backgroundColor: '#522416' }}
      />

      {/* Subtle architectural vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, transparent 0%, rgba(36, 16, 10, 0.52) 100%)',
        }}
      />
    </div>
  );
};
