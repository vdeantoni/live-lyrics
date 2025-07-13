// Utility Functions
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const parseLRC = (lrcContent) => {
  if (!lrcContent) {
    return [];
  }

  const lines = lrcContent
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);
      if (match) {
        const [, minutes, seconds, hundredths, text] = match;
        const time =
          parseInt(minutes) * 60 +
          parseInt(seconds) +
          parseInt(hundredths) / (hundredths.length === 3 ? 1000 : 100);
        return { time, text: text.trim() };
      }
      return null;
    })
    .filter(Boolean);

  return lines.map(({ time, text }) => ({
    time,
    text,
  }));
};
