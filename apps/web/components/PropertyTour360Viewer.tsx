'use client';

import { useEffect, useRef } from 'react';

type ViewerInstance = { destroy(): void };

interface PropertyTour360ViewerProps {
  src: string;
  title: string;
}

export function PropertyTour360Viewer({ src, title }: PropertyTour360ViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    let viewer: ViewerInstance | undefined;

    async function loadViewer() {
      const { Viewer } = await import('@photo-sphere-viewer/core');
      if (!mounted || !containerRef.current) return;

      viewer = new Viewer({
        container: containerRef.current,
        panorama: src,
        caption: title,
        touchmoveTwoFingers: true,
        mousewheelCtrlKey: true,
        navbar: ['zoom', 'move', 'fullscreen'],
      }) as ViewerInstance;
    }

    void loadViewer();

    return () => {
      mounted = false;
      viewer?.destroy();
    };
  }, [src, title]);

  return (
    <div className="tour360Viewer">
      <div className="tour360Canvas" ref={containerRef} aria-label={`Vista 360 de ${title}`} />
      <p className="tour360Hint">Arrastra la imagen para recorrer el inmueble en 360.</p>
    </div>
  );
}