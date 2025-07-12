document.addEventListener("DOMContentLoaded", () => {
  const songTitleEl = document.getElementById("song-title");
  const songArtistEl = document.getElementById("song-artist");
  const lyricsContainerEl = document.getElementById("lyrics-container");
  const progressBarEl = document.getElementById("progress-bar");
  const currentTimeEl = document.getElementById("current-time");
  const totalDurationEl = document.getElementById("total-duration");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const playerControlsEl = document.querySelector(".player-controls");

  let state = {
    songData: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentLyricIndex: -1,
    animationFrameId: null,
    isProgrammaticScroll: false,
    scrollTimeout: null,
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const parseLRC = (lrcContent) => {
    if (!lrcContent) return [];
    const lines = lrcContent.split("\n");
    const lyrics = [];
    const timeRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const [, minutes, seconds, hundredths, text] = match;
        const time =
          parseInt(minutes) * 60 +
          parseInt(seconds) +
          parseInt(hundredths) / (hundredths.length === 3 ? 1000 : 100);
        lyrics.push({ time, text: text.trim() });
      }
    }
    return lyrics;
  };

  const updateLyricsUI = (skipScroll = false) => {
    const { currentTime, songData } = state;
    if (!songData || !songData.lyrics) return;

    let newLyricIndex = -1;
    for (let i = songData.lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= songData.lyrics[i].time) {
        newLyricIndex = i;
        break;
      }
    }

    if (newLyricIndex !== state.currentLyricIndex || newLyricIndex === -1) {
      state.currentLyricIndex = newLyricIndex;

      lyricsContainerEl.querySelectorAll(".lyric-line").forEach((line) => {
        const index = parseInt(line.dataset.index, 10);
        const distance = Math.abs(index - newLyricIndex);

        const opacity = Math.pow(0.45, distance);
        line.style.opacity = opacity;

        const scale = Math.pow(0.99, distance * 6);
        const rotateX = distance === 0 ? 0 : 55;
        line.style.transform = `rotateX(${rotateX}deg) scale(${scale})`;
        line.style.transition = `color 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            transform ${Math.min(distance * 200, 500)}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${0}ms,
            opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;

        if (distance === 0) {
          line.classList.add("active");
        } else {
          line.classList.remove("active");
        }
      });

      const activeLine = lyricsContainerEl.querySelector(".active");
      if (activeLine && !skipScroll) {
        state.isProgrammaticScroll = true;
        activeLine.scrollIntoView({ behavior: "smooth", block: "end" });
        setTimeout(() => (state.isProgrammaticScroll = false), 600);
      }
    }
  };

  const gameLoop = () => {
    if (state.isPlaying) {
      const now = performance.now();
      const delta = (now - state.lastFrameTime) / 1000;
      state.currentTime += delta;
      state.lastFrameTime = now;

      if (state.currentTime >= state.duration) {
        state.currentTime = state.duration;
        togglePlayPause();
      }
      progressBarEl.value = state.currentTime;
      currentTimeEl.textContent = formatTime(state.currentTime);
      updateLyricsUI();
      state.animationFrameId = requestAnimationFrame(gameLoop);
    }
  };

  const togglePlayPause = () => {
    state.isPlaying = !state.isPlaying;
    playPauseBtn.textContent = state.isPlaying ? "❚❚" : "▶";

    if (state.isPlaying) {
      if (state.currentTime >= state.duration) {
        state.currentTime = 0;
        progressBarEl.value = 0;
      }
      state.lastFrameTime = performance.now();
      state.animationFrameId = requestAnimationFrame(gameLoop);
    } else {
      cancelAnimationFrame(state.animationFrameId);
    }
  };

  const handleScrub = (e) => {
    state.currentTime = parseFloat(e.target.value);
    currentTimeEl.textContent = formatTime(state.currentTime);
    updateLyricsUI();
  };

  const handleScroll = () => {
    if (state.isProgrammaticScroll || !state.songData) return;

    clearTimeout(state.scrollTimeout);
    state.scrollTimeout = setTimeout(() => {
      const containerBottom = lyricsContainerEl.getBoundingClientRect().bottom;
      let closestLine = null;
      let minDistance = Infinity;

      lyricsContainerEl.querySelectorAll(".lyric-line").forEach((line) => {
        const lineBottom = line.getBoundingClientRect().bottom;
        const distance = Math.abs(
          lineBottom - (containerBottom - line.clientHeight / 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestLine = line;
        }
      });

      if (closestLine) {
        const newIndex = parseInt(closestLine.dataset.index, 10);
        const newTime = state.songData.lyrics[newIndex].time;

        if (Math.abs(newTime - state.currentTime) > 0.5) {
          state.currentTime = newTime;
          progressBarEl.value = state.currentTime;
          currentTimeEl.textContent = formatTime(state.currentTime);
          updateLyricsUI(true); // Update visuals without scrolling
        }
      }
    }, 10);
  };

  const populateUI = (data) => {
    state.songData = data;
    state.duration = data.duration;

    songTitleEl.textContent = data.name;
    songArtistEl.textContent = data.artist;
    totalDurationEl.textContent = formatTime(data.duration);
    progressBarEl.max = data.duration;
    progressBarEl.value = 0;
    currentTimeEl.textContent = formatTime(0);

    lyricsContainerEl.innerHTML = "";
    if (data.lyrics && data.lyrics.length > 0) {
      data.lyrics.forEach((line, index) => {
        const p = document.createElement("span");
        p.textContent = line.text || "...";
        p.classList.add("lyric-line");
        p.dataset.index = index;
        p.addEventListener("click", () => {
          if (state.songData && state.songData.lyrics[index]) {
            const newTime = state.songData.lyrics[index].time;
            state.currentTime = newTime;
            progressBarEl.value = state.currentTime;
            currentTimeEl.textContent = formatTime(state.currentTime);
            updateLyricsUI();
          }
        });
        lyricsContainerEl.appendChild(p);
      });
      playerControlsEl.style.display = "block";
    } else {
      lyricsContainerEl.innerHTML =
        '<p style="text-align: center; color: #666;">No synchronized lyrics found.</p>';
      playerControlsEl.style.display = "none";
    }

    updateLyricsUI();
  };

  const fetchSongData = async () => {
    try {
      const musicDataResponse = await fetch(`http://127.0.0.1:3000/music`);
      const musicData = await musicDataResponse.json();

      songTitleEl.textContent = musicData.name;
      songArtistEl.textContent = musicData.artist;

      const lyricsResponse = await fetch(
        `https://lrclib.net/api/search?artist_name=${encodeURIComponent(musicData.artist)}&track_name=${encodeURIComponent(musicData.name)}`,
      );
      const lyricsData = await lyricsResponse.json();

      let finalLyrics = [];
      if (lyricsData && lyricsData.length > 0 && lyricsData[0].syncedLyrics) {
        finalLyrics = parseLRC(lyricsData[0].syncedLyrics);
      }

      populateUI({
        ...musicData,
        duration: parseFloat(musicData.duration),
        lyrics: finalLyrics,
      });
    } catch (error) {
      songTitleEl.textContent = "Failed to load song data";
      lyricsContainerEl.innerHTML = `<p style="text-align: center; color: #cc0000;">Could not fetch song data or lyrics. Error: ${error.message}</p>`;
      console.error("Error fetching data:", error);
    }
  };

  playPauseBtn.addEventListener("click", togglePlayPause);
  progressBarEl.addEventListener("input", handleScrub);
  lyricsContainerEl.addEventListener("scroll", handleScroll);

  fetchSongData();
});
