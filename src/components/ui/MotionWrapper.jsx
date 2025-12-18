import { motion, AnimatePresence } from 'framer-motion';

// 1. Kinetic Fade In (Standard Entry)
export const FadeIn = ({ children, delay = 0, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1.0], // Kinetic Bezier
            delay
        }}
        className={className}
    >
        {children}
    </motion.div>
);

// 2. Stagger Container (Orchestrator)
export const StaggerContainer = ({ children, staggerDelay = 0.1, className = "" }) => (
    <motion.div
        initial="hidden"
        animate="show"
        exit="hidden"
        variants={{
            hidden: { opacity: 0 },
            show: {
                opacity: 1,
                transition: {
                    staggerChildren: staggerDelay
                }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

// 3. Stagger Item (Child of Container)
export const StaggerItem = ({ children, className = "" }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 20 },
            show: {
                opacity: 1,
                y: 0,
                transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                }
            }
        }}
        className={className}
    >
        {children}
    </motion.div>
);

// 4. Panel Morph (Layout Transition)
export const Panel = ({ children, className = "" }) => (
    <motion.div
        layout
        transition={{
            layout: { duration: 0.4, type: "spring", stiffness: 100, damping: 20 }
        }}
        className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
    >
        {children}
    </motion.div>
);

// 5. Scale Button (Click Interaction)
export const ScaleButton = ({ children, onClick, className = "", disabled = false, type = "button" }) => (
    <motion.button
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        onClick={onClick}
        className={className}
        disabled={disabled}
        type={type}
    >
        {children}
    </motion.button>
);
