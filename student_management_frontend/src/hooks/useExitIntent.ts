import { useState, useEffect } from 'react';

const useExitIntent = (delay: number = 3000) => {
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (hasShown) return;

    let timer: NodeJS.Timeout;

    const triggerModal = () => {
      if (!hasShown) {
        setShowModal(true);
        setHasShown(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      // Check if the mouse is leaving the window (moving towards the top)
      if (e.clientY <= 0 && e.clientX >= 0 && e.clientX <= window.innerWidth) {
        timer = setTimeout(triggerModal, delay);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerModal();
      }
    };

    const handlePageHide = (e: PageTransitionEvent | BeforeUnloadEvent) => {
      triggerModal();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect alt+F4 or cmd+W
      if ((e.key === 'F4' && e.altKey) || (e.key === 'w' && (e.ctrlKey || e.metaKey))) {
        triggerModal();
      }
    };

    // Add event listeners
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      document.removeEventListener('keydown', handleKeyDown);
      
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [delay, hasShown]);

  const closeModal = () => {
    setShowModal(false);
  };

  return { showModal, closeModal };
};

export default useExitIntent;