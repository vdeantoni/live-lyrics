import { motion } from "framer-motion";
import { Radio } from "lucide-react";

/**
 * EmptyScreen component displayed when no song is currently playing
 * Shows a friendly message encouraging the user to start playing music
 */
const EmptyScreen = () => {
  return (
    <div
      data-testid="empty-screen"
      className="bg-background flex h-full w-full items-center justify-center p-8"
    >
      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Rotating vinyl record */}
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 shadow-2xl">
          <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-slate-600/50">
            <div className="h-8 w-8 rounded-full bg-slate-900/60 shadow-inner">
              <div className="flex h-full w-full items-center justify-center rounded-full border border-slate-700">
                <Radio className="h-4 w-4 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* App title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-2xl font-bold text-transparent">
            No music playing
          </h1>
          <motion.p
            className="mt-2 text-white/60"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Start playing a song to see live synchronized lyrics here.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default EmptyScreen;
