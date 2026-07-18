import { useEffect, useRef } from 'react';

export function useOnClickOutside(callback: () => void, ...refs: React.RefObject<HTMLElement | null>[]) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      const clickedOutside = refs.every(
        (ref) => ref.current && target && !ref.current.contains(target)
      );
      if (clickedOutside) {
        callbackRef.current();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [refs]);
}
