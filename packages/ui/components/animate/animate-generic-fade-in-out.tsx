import { motion } from 'framer-motion';

type AnimateGenericFadeInOutProps = {
  children: React.ReactNode;
  className?: string;
  motionKey?: string;
};

export const AnimateGenericFadeInOut = ({
  children,
  className,
  motionKey,
}: AnimateGenericFadeInOutProps) => {
  return (
    <motion.section
      key={motionKey}
      /* Skip opacity-0 initial state — used in Select triggers & document flow; stuck opacity hid inputs in dark UI. */
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={className}
    >
      {children}
    </motion.section>
  );
};
