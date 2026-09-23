import React from 'react';

export default function DecorativeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--background)]">
      
      {/* Small organic shape partially outside the left edge */}
      <svg
        className="absolute top-[20%] -left-[5%] w-[200px] h-[200px] opacity-20 mix-blend-multiply md:w-[300px] md:h-[300px]"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="var(--primary-soft)"
          d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.7,-2.1C98.6,13.8,94.3,30.1,84.4,43.2C74.5,56.3,59.1,66.1,43.4,74.5C27.7,82.9,11.7,89.9,-3.9,96.4C-19.5,102.9,-34.7,108.9,-48.5,103.5C-62.3,98.1,-74.7,81.3,-82.9,64.2C-91.1,47.1,-95.1,29.7,-96.2,12.5C-97.3,-4.7,-95.5,-21.7,-88.7,-36.8C-81.9,-51.9,-70.1,-65.1,-55.6,-72.1C-41.1,-79.1,-23.9,-79.9,-8,-66.3C8,-52.7,25.9,-24.7,30.5,-83.6Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Small/medium orange blob in the top-right corner */}
      <svg
        className="absolute -top-[5%] -right-[5%] w-[180px] h-[180px] opacity-25 mix-blend-multiply md:w-[250px] md:h-[250px]"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="var(--primary-light)"
          d="M60.4,-67.2C76,-52.1,84.7,-30.2,85.1,-9.1C85.5,12,77.6,32.3,64.2,48.2C50.8,64.1,31.9,75.6,11.1,79.5C-9.7,83.4,-32.4,79.7,-48.9,67.3C-65.4,54.9,-75.7,33.8,-79.6,12.2C-83.5,-9.4,-81,-31.5,-68.8,-48.3C-56.6,-65.1,-34.7,-76.6,-13.3,-74.8C8.1,-73,34.8,-83.1,60.4,-67.2Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* A few small circles for creative detail */}
      <div className="absolute top-[25%] right-[12%] w-3 h-3 rounded-full bg-[var(--primary)] opacity-30"></div>
      <div className="absolute top-[60%] left-[8%] w-5 h-5 rounded-full border-2 border-[var(--primary-bright)] opacity-20"></div>
      <div className="absolute bottom-[35%] right-[20%] w-2 h-2 rounded-full bg-[var(--primary-light)] opacity-50"></div>
      <div className="absolute top-[15%] left-[25%] w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-20"></div>

      {/* Very subtle curved light-orange shape near the bottom */}
      {/* Background soft wave */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[12vh] opacity-40 mix-blend-multiply"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="var(--surface-2)"
          fillOpacity="1"
          d="M0,224L48,229.3C96,235,192,245,288,245.3C384,245,480,235,576,202.7C672,171,768,117,864,122.7C960,128,1056,192,1152,197.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
      {/* Foreground smaller soft wave */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[8vh] opacity-50 mix-blend-multiply"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="var(--surface)"
          fillOpacity="1"
          d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,176C672,139,768,85,864,85.3C960,85,1056,139,1152,149.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  );
}
