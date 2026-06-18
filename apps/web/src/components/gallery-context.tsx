'use client';

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

// Comparte el índice de imagen activa entre la galería y el selector de
// variante (al elegir una variante, la galería salta a su foto).
interface GalleryState {
  index: number;
  setIndex: Dispatch<SetStateAction<number>>;
}

const GalleryContext = createContext<GalleryState | null>(null);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  return (
    <GalleryContext.Provider value={{ index, setIndex }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery(): GalleryState | null {
  return useContext(GalleryContext);
}
