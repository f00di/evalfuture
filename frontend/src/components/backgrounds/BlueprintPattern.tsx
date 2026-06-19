export default function BlueprintPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]" aria-hidden="true">
      <svg className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="blueprint-grid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V42" fill="none" stroke="#102A43" strokeWidth="0.8" />
          </pattern>
          <pattern id="blueprint-large-grid" width="168" height="168" patternUnits="userSpaceOnUse">
            <rect width="168" height="168" fill="url(#blueprint-grid)" />
            <path d="M168 0H0V168" fill="none" stroke="#0F766E" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-large-grid)" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke="#0B1F33" strokeWidth="2">
            <path d="M92 246h204M112 246V136l82-54 82 54v110" />
            <path d="M172 246v-56h44v56M140 158h28M220 158h28M140 202h28M220 202h28" />
            <path d="M510 102h210v118H510z" />
            <path d="M538 190l42-38 40 20 58-60" />
            <path d="M646 112h32v32" />
          </g>
          <g stroke="#0F766E" strokeWidth="2">
            <path d="M384 318h172" />
            <path d="M520 286l36 32-36 32" />
            <path d="M384 350h172" />
            <path d="M420 318l-36 32 36 32" />
          </g>
          <g stroke="#334155" strokeWidth="2">
            <path d="M92 418c92-38 148-48 206-24 64 26 114 64 190 36 56-21 86-64 160-78" />
            <path d="M620 344l34 8-18 30" />
          </g>
        </g>
      </svg>
    </div>
  );
}
