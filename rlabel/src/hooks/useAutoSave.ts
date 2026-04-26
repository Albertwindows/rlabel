import { useEffect, useRef } from 'react';
import { useAnnotationStore } from '../store/annotationStore';
import { saveAnnotationsForImage } from '../utils/fileOps';

const DEBOUNCE_MS = 500;

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAnnotationsRef = useRef<string>('');
  const isSavingRef = useRef(false);

  const annotations = useAnnotationStore((s) => s.annotations);
  const autoSave = useAnnotationStore((s) => s.autoSave);
  const images = useAnnotationStore((s) => s.images);
  const currentImageIndex = useAnnotationStore((s) => s.currentImageIndex);
  const imageName = useAnnotationStore((s) => s.imageName);

  useEffect(() => {
    if (!autoSave || !imageName || currentImageIndex < 0 || !images[currentImageIndex]) {
      return;
    }

    const snapshot = JSON.stringify(annotations);
    if (snapshot === prevAnnotationsRef.current) return;
    prevAnnotationsRef.current = snapshot;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await saveAnnotationsForImage(images[currentImageIndex]);
      } finally {
        isSavingRef.current = false;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [annotations, autoSave, images, currentImageIndex, imageName]);
}
