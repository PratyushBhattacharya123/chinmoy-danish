import React from "react";

const CustomLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[75vh]">
      <div className="relative w-16 h-16 mb-6">
        {/* Animated gradient ring */}
        <div className="absolute inset-0 rounded-full border-[5px] border-transparent border-t-gray-600 border-r-gray-400 animate-spin" />

        {/* Center logo or icon */}
        <div className="absolute inset-4 flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-pulse"
          >
            <path
              d="M12 2L3 7L12 12L21 7L12 2Z"
              stroke="url(#paint0_linear)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#475569"
            />
            <path
              d="M3 12L12 17L21 12"
              stroke="url(#paint1_linear)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 17L12 22L21 17"
              stroke="url(#paint2_linear)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient
                id="paint0_linear"
                x1="3"
                y1="7"
                x2="21"
                y2="7"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#475569" />
                <stop offset="1" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient
                id="paint1_linear"
                x1="3"
                y1="12"
                x2="21"
                y2="12"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#475569" />
                <stop offset="1" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient
                id="paint2_linear"
                x1="3"
                y1="17"
                x2="21"
                y2="17"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#475569" />
                <stop offset="1" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CustomLoader;
