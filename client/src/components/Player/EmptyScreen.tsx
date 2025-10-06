import { motion } from "framer-motion";
import { Music } from "lucide-react";

/**
 * EmptyScreen component displayed when no song is currently playing
 * Shows a friendly message encouraging the user to start playing music
 */
const EmptyScreen = () => {
  return (
    <div
      data-testid="empty-screen"
      className="flex h-full w-full items-center justify-center p-8"
    >
      <motion.div
        className="flex max-w-md flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl ring-1 ring-white/10">
            <Music className="h-10 w-10 text-white/60" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="mb-2 text-2xl font-semibold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          No music playing
        </motion.h2>

        {/* Description */}
        <motion.p
          className="mb-6 text-white/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Start playing a song in your music player to see live synchronized
          lyrics here.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default EmptyScreen;
