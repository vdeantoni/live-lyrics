document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const songTitleEl = document.getElementById("song-title");
  const songArtistEl = document.getElementById("song-artist");
  const lyricsContainerEl = document.getElementById("lyrics-container");
  const progressBarEl = document.getElementById("progress-bar");
  const currentTimeEl = document.getElementById("current-time");
  const totalDurationEl = document.getElementById("total-duration");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const playerControlsEl = document.querySelector(".player-controls");
  const lyricsViewportEl = document.querySelector(".lyrics-viewport");

  // Application State
  let state = {
    currentSong: {
      name: "Loading...",
      artist: "",
      album: "",
      duration: 0,
      artwork: "",
      lyrics: [],
    },
    player: {
      isPlaying: false,
      currentTime: 0,
      isSeeking: false,
    },
    ui: {
      currentLyricIndex: -1,
      isProgrammaticScroll: false,
      scrollTimeout: null,
    },
    animationFrameId: null,
    pollingIntervalId: null,
  };

  // UI Rendering Functions
  const renderSongInfo = () => {
    songTitleEl.textContent = state.currentSong.name;
    songArtistEl.textContent = state.currentSong.artist;
    lyricsViewportEl.style.backgroundImage = `url(${state.currentSong.artwork})`;
  };

  const renderPlayerControls = () => {
    const { currentTime } = state.player;
    const { duration } = state.currentSong;
    progressBarEl.max = duration;
    progressBarEl.value = currentTime;
    totalDurationEl.textContent = formatTime(duration);
    currentTimeEl.textContent = formatTime(currentTime);
    playPauseBtn.textContent = state.player.isPlaying ? "❚❚" : "▶";
  };

  const renderLyrics = () => {
    lyricsContainerEl.innerHTML = "";
    if (state.currentSong.lyrics.length > 0) {
      state.currentSong.lyrics.forEach((line, index) => {
        const p = document.createElement("span");
        p.textContent = line.text || "...";
        p.classList.add("lyric-line");
        p.dataset.index = index;
        p.addEventListener("click", () => {
          state.player.currentTime = state.currentSong.lyrics[index].time;
          updateUI();
        });
        lyricsContainerEl.appendChild(p);
      });
      playerControlsEl.style.display = "block";
    } else {
      lyricsContainerEl.innerHTML =
        '<p style="text-align: center; color: #666;">No synchronized lyrics found.</p>';
      playerControlsEl.style.display = "none";
    }
  };

  const updateActiveLyric = (skipScroll = false) => {
    const { currentTime } = state.player;
    const { lyrics } = state.currentSong;
    if (!lyrics) return;

    let newLyricIndex = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        newLyricIndex = i;
        break;
      }
    }

    if (newLyricIndex !== state.ui.currentLyricIndex) {
      state.ui.currentLyricIndex = newLyricIndex;
      lyricsContainerEl.querySelectorAll(".lyric-line").forEach((line) => {
        const index = parseInt(line.dataset.index, 10);
        const distance = Math.abs(index - newLyricIndex);
        line.style.opacity = Math.pow(0.45, distance);
        line.style.transform = `rotateX(${
          distance === 0 ? 0 : 55
        }deg) scale(${Math.pow(0.99, distance * 6)})`;
        line.classList.toggle("active", distance === 0);
      });

      const activeLine = lyricsContainerEl.querySelector(".active");
      if (activeLine && !skipScroll) {
        state.ui.isProgrammaticScroll = true;
        activeLine.scrollIntoView({ behavior: "smooth", block: "end" });
        setTimeout(() => (state.ui.isProgrammaticScroll = false), 600);
      }
    }
  };

  const updateUI = () => {
    renderSongInfo();
    renderPlayerControls();
    updateActiveLyric();
  };

  // Data Fetching and State Management
  const loadNewSong = async () => {
    try {
      const artworkResponse = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          state.currentSong.artist,
        )}+${encodeURIComponent(state.currentSong.name)}&entity=song&limit=1`,
      );
      const artworkData = await artworkResponse.json();
      if (artworkData.results?.length > 0) {
        state.currentSong.artwork =
          artworkData.results[0].artworkUrl100.replace(
            "100x100bb",
            "1000x1000bb",
          );
      }
    } catch (e) {
      console.error("Could not fetch artwork:", e);
    }

    try {
      const lyricsResponse = await fetch(
        `https://lrclib.net/api/search?artist_name=${encodeURIComponent(
          state.currentSong.artist,
        )}&track_name=${encodeURIComponent(state.currentSong.name)}`,
      );
      const lyricsData = await lyricsResponse.json();
      if (lyricsData?.length > 0) {
        const bestMatch = lyricsData.reduce((best, current) => {
          if (!current.syncedLyrics) return best;
          const currentDiff = Math.abs(
            state.currentSong.duration - current.duration,
          );
          const bestDiff = best
            ? Math.abs(state.currentSong.duration - best.duration)
            : Infinity;
          return currentDiff < bestDiff ? current : best;
        }, null);
        if (bestMatch) {
          state.currentSong.lyrics = parseLRC(bestMatch.syncedLyrics);
        }
      }
    } catch (e) {
      console.error("Could not fetch lyrics:", e);
    }

    renderLyrics();
  };

  const syncWithServer = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:4000/music`);
      const musicData = await res.json();

      state.player.isPlaying = musicData.playerState === "playing";
      state.player.currentTime = parseFloat(musicData.currentTime || "0");

      const isNewSong = musicData.name !== state.currentSong?.name;

      state.currentSong = {
        ...state.currentSong,
        ...musicData,
        duration: parseFloat(musicData.duration || "0"),
      };

      if (isNewSong) {
        state.currentSong = {
          ...state.currentSong,
          artwork: "",
          lyrics: [],
        };

        loadNewSong();
      }
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // Player Loop
  const gameLoop = () => {
    if (state.player.isPlaying && !state.player.isSeeking) {
      updateUI();
    }

    state.animationFrameId = requestAnimationFrame(gameLoop);
  };

  // Event Handlers
  const togglePlayPause = async () => {
    await fetch("http://127.0.0.1:4000/music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playing: !state.player.isPlaying }),
    }).catch((error) => console.error("Error updating playing state:", error));
  };

  const handleScrub = (e) => {
    state.player.currentTime = parseFloat(e.target.value);
  };

  const init = async () => {
    playPauseBtn.addEventListener("click", () => togglePlayPause());
    progressBarEl.addEventListener("input", handleScrub);
    progressBarEl.addEventListener("mousedown", () => {
      state.player.isSeeking = true;
    });
    progressBarEl.addEventListener("mouseup", () => {
      state.player.isSeeking = false;
    });
    lyricsContainerEl.addEventListener("scroll", () => {
      /* scroll handling logic can be added here if needed */
    });

    state.pollingIntervalId = setInterval(syncWithServer, 1000);
    requestAnimationFrame(gameLoop);
  };

  init();
});
