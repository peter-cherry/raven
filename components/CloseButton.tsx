export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="close-button"
      aria-label="Close"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line
          x1="4"
          y1="4"
          x2="16"
          y2="16"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <line
          x1="16"
          y1="4"
          x2="4"
          y2="16"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
