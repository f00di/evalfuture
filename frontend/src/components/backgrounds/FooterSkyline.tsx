export default function FooterSkyline() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-[0.045]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1440 180" className="h-full w-full" preserveAspectRatio="none" fill="none">
        <path
          d="M0 150H78V98h44v52h58V72h76v78h56V34h96v116h50V92h72v58h72V52h98v98h64V82h82v68h58V28h112v122h54V104h86v46h82V66h80v84h82V42h86v108h74"
          fill="#0B1F33"
        />
        <path
          d="M118 120h24M214 104h28M214 126h28M350 64h32M350 92h32M350 120h32M552 118h30M636 82h32M636 112h32M810 104h30M964 58h36M964 88h36M964 118h36M1180 126h34M1286 78h30M1286 108h30"
          stroke="#0B1F33"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
