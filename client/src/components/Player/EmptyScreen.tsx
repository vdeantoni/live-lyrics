import { motion } from "framer-motion";
import { Music, Radio, PlayCircle } from "lucide-react";

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

            {/* Decorative orbiting icons */}
            <motion.div
              className="absolute"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <PlayCircle className="absolute -right-2 -top-2 h-6 w-6 text-blue-400/60" />
            </motion.div>
            <motion.div
              className="absolute"
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Radio className="absolute -bottom-2 -left-2 h-6 w-6 text-purple-400/60" />
            </motion.div>
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

        {/* Hint text */}
        <motion.div
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-3 text-sm text-white/50 ring-1 ring-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Music className="h-4 w-4 flex-shrink-0" />
          <span>
            Tip: Make sure your music player is running and playing a song
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EmptyScreen;
