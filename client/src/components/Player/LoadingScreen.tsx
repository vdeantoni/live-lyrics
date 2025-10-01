import { motion } from "framer-motion";
import { Music, Radio } from "lucide-react";

const LoadingScreen = () => {
  // Floating music notes animation
  const musicNotes = Array.from({ length: 6 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute"
      initial={{
        x: Math.random() * 300,
        y: Math.random() * 200 + 100,
        opacity: 0.6,
        scale: 0.8 + Math.random() * 0.4,
      }}
      animate={{
        y: [null, -50, null],
        x: [null, Math.random() * 50 - 25, null],
        opacity: [0.6, 1, 0.4, 1],
        rotate: [0, 15, -10, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2,
      }}
    >
      <Music className="h-6 w-6 text-white/70" />
    </motion.div>
  ));

  // Soundwave bars animation
  const soundwaveBars = Array.from({ length: 12 }, (_, i) => (
    <motion.div
      key={i}
      className="rounded-full bg-gradient-to-t from-blue-500/60 to-purple-500/60"
      style={{
        width: "4px",
        height: "20px",
      }}
      animate={{
        scaleY: [1, 0.3, 1.8, 0.5, 2, 0.8, 1],
        opacity: [0.4, 1, 0.6, 1, 0.7, 1, 0.5],
      }}
      transition={{
        duration: 1.2 + Math.random() * 0.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.1,
      }}
    />
  ));

  return (
    <div
      data-testid="loading-screen"
      className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-blue-900/20 to-purple-900/20"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"
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

      {/* Floating music notes */}
      <div className="absolute inset-0">{musicNotes}</div>

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

        {/* Soundwave visualization */}
        <motion.div
          className="flex items-end space-x-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {soundwaveBars}
        </motion.div>
      </div>

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
    </div>
  );
};

export default LoadingScreen;
