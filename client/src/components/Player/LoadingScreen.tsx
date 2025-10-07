import { motion } from "framer-motion";
import { Radio } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div
      data-testid="loading-screen"
      className="to-background/20 absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-blue-900/20"
    >
      {/* Animated background gradient */}
      <motion.div
        className="to-primary/10 via-secondary/10 absolute inset-0 bg-gradient-to-r from-blue-600/10"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))",
            "linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1))",
            "linear-gradient(225deg, rgba(236, 72, 153, 0.1), rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))",
            "linear-gradient(315deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Rotating vinyl record */}
        <motion.div
          className="relative flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 shadow-2xl">
            <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-slate-600/50">
              <div className="h-8 w-8 rounded-full bg-slate-900 shadow-inner">
                <div className="flex h-full w-full items-center justify-center rounded-full border border-slate-700">
                  <Radio className="h-4 w-4 text-white/60" />
                </div>
              </div>
            </div>
          </div>
          {/* Record grooves */}
          <div className="absolute inset-2 rounded-full border border-slate-600/30" />
          <div className="absolute inset-4 rounded-full border border-slate-600/20" />
          <div className="absolute inset-6 rounded-full border border-slate-600/10" />
        </motion.div>

        {/* App title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <h1 className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-2xl font-bold text-transparent">
            Live Lyrics
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
            Preparing your music experience...
          </motion.p>
        </motion.div>
      </div>

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </div>
  );
};

export default LoadingScreen;
