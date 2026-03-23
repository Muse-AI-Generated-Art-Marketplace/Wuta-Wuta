import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 20 : -20,
    scale: 0.98
  }),
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
    scale: 1.02
  })
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

const slideVariants = {
  initial: {
    opacity: 0,
    y: 30
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -30
  }
};

const fadeVariants = {
  initial: {
    opacity: 0,
    scale: 0.95
  },
  in: {
    opacity: 1,
    scale: 1
  },
  out: {
    opacity: 0,
    scale: 1.05
  }
};

const PageTransition = ({ children, location, transitionType = 'slide' }) => {
  const getVariants = () => {
    switch (transitionType) {
      case 'fade':
        return fadeVariants;
      case 'slide':
        return slideVariants;
      default:
        return pageVariants;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="in"
        exit="out"
        variants={getVariants()}
        transition={pageTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
