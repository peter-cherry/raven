'use client';

import { useEffect, useRef, useState } from 'react';

export default function InteractiveDottedMap() {
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const smallDotsContainerRef = useRef<HTMLDivElement>(null);
  const [svgLoaded, setSvgLoaded] = useState(false);

  useEffect(() => {
    if (!dotsContainerRef.current || !smallDotsContainerRef.current) return;

    // Fetch and inject SVG content for both layers
    fetch('/map-dotted-pattern.svg')
      .then(response => response.text())
      .then(svgContent => {
        if (!dotsContainerRef.current || !smallDotsContainerRef.current) return;

        // Inject SVG for dots (top layer)
        dotsContainerRef.current.innerHTML = svgContent;

        // Inject SVG for small dots (under solid fill)
        smallDotsContainerRef.current.innerHTML = svgContent;
        setSvgLoaded(true);

        // === Configure DOTS layer (top) ===
        const dotsSvg = dotsContainerRef.current.querySelector('svg');
        if (dotsSvg) {
          dotsSvg.style.width = '100%';
          dotsSvg.style.height = '100%';
          dotsSvg.style.display = 'block';

          // Update the style tag to change dot color with 1% more luminosity than solid layer
          const dotsStyleTag = dotsSvg.querySelector('style');
          if (dotsStyleTag && dotsStyleTag.textContent) {
            dotsStyleTag.textContent = dotsStyleTag.textContent.replace(
              'fill: #fbb040;',
              'fill: #434367; transition: all 0.2s ease; cursor: pointer;'
            );
          }

          // Get all dots with class st1
          const dots = dotsSvg.querySelectorAll('.st1');

          dots.forEach((dot) => {
            const circle = dot as SVGElement;

            // Add hover listeners
            circle.addEventListener('mouseenter', () => {
              circle.style.fill = '#7E7AA8'; // Purple on hover
              circle.style.transform = 'scale(1.5)';
              circle.style.transformOrigin = 'center';
            });

            circle.addEventListener('mouseleave', () => {
              circle.style.fill = '#434367'; // Back to dots color (1% brighter)
              circle.style.transform = 'scale(1)';
            });
          });
        }

        // === Configure SMALL DOTS layer (under solid fill) ===
        const smallDotsSvg = smallDotsContainerRef.current.querySelector('svg');
        if (smallDotsSvg) {
          smallDotsSvg.style.width = '100%';
          smallDotsSvg.style.height = '100%';
          smallDotsSvg.style.display = 'block';

          // Update style tag - make dots same color as regular dots
          const smallDotsStyleTag = smallDotsSvg.querySelector('style');
          if (smallDotsStyleTag && smallDotsStyleTag.textContent) {
            smallDotsStyleTag.textContent = smallDotsStyleTag.textContent.replace(
              'fill: #fbb040;',
              'fill: #434367;'
            );
          }

          // Scale all dots to half size
          const smallDots = smallDotsSvg.querySelectorAll('.st1');
          smallDots.forEach((dot) => {
            (dot as SVGElement).style.transform = 'scale(0.5)';
            (dot as SVGElement).style.transformOrigin = 'center';
          });
        }
      })
      .catch(error => {
        console.error('Error loading SVG:', error);
      });

    return () => {
      if (dotsContainerRef.current) {
        dotsContainerRef.current.innerHTML = '';
      }
      if (smallDotsContainerRef.current) {
        smallDotsContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <>
      {/* Small dots layer - very bottom */}
      <div
        ref={smallDotsContainerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* Solid fill layer - middle layer with drop shadow effect */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))'
        }}
      >
        <img
          src="/map-solid-dots-color.png"
          alt="USA Map Solid Fill"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100vw',
            height: '100vh',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Interactive dots layer - top layer */}
      <div
        ref={dotsContainerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 3,
          pointerEvents: 'auto'
        }}
      />
    </>
  );
}
