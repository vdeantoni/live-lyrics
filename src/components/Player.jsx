import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const PlayerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 5px;
  background-color: #ccc;
  border-radius: 5px;
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  height: 100%;
  background-color: #007bff;
  border-radius: 5px;
  transition: width 0.1s linear;
`;

const LyricsWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 40vh 0;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const LyricLine = styled.div`
  text-align: center;
  font-size: 2em;
  opacity: 0.5;
  transition: all 0.3s ease-in-out;
  &.active-line {
    opacity: 1;
    font-weight: 700;
    transform: scale(1.1);
  }
`;

const parseLrc = lrcText => {
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);
      const text = match[4].trim();
      const time = minutes * 60 + seconds + milliseconds / 1000;
      result.push({ time, text });
    }
  }
  return result;
};

function Player({ song }) {
  const lyricsWrapperRef = useRef(null);
  const intervalRef = useRef(null);
  const [lyrics, setLyrics] = useState([]);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (song && song.lrcUrl) {
      fetch(song.lrcUrl)
        .then(res => res.text())
        .then(text => {
          const parsedLyrics = parseLrc(text);
          if (!parsedLyrics.length) {
            setLyrics([]);
            setProgress(0);
            setActiveLineIndex(-1);
            return;
          }

          setLyrics(parsedLyrics);
          setActiveLineIndex(0);
          setProgress(0);

          const totalDuration = parsedLyrics[parsedLyrics.length - 1].time;
          let currentTime = 0;

          intervalRef.current = setInterval(() => {
            currentTime += 0.1;
            if (currentTime > totalDuration) {
              clearInterval(intervalRef.current);
              setProgress(100);
              return;
            }

            const progressPercentage = (currentTime / totalDuration) * 100;
            setProgress(progressPercentage);

            let newActiveLineIndex = 0;
            for (let i = 0; i < parsedLyrics.length; i++) {
              if (currentTime >= parsedLyrics[i].time) {
                newActiveLineIndex = i;
              } else {
                break;
              }
            }
            setActiveLineIndex(newActiveLineIndex);
          }, 100);
        })
        .catch(error => {
          console.error('Error fetching lyrics:', error);
          setLyrics([]);
          setProgress(0);
          setActiveLineIndex(-1);
        });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [song]);

  useEffect(() => {
    if (lyricsWrapperRef.current && activeLineIndex !== null && activeLineIndex >= 0) {
      const activeLine = lyricsWrapperRef.current.children[activeLineIndex];
      if (activeLine) {
        const wrapperRect = lyricsWrapperRef.current.getBoundingClientRect();
        const scrollCenter = wrapperRect.height / 2;
        const lineTop = activeLine.offsetTop;
        const lineCenter = activeLine.offsetHeight / 2;

        lyricsWrapperRef.current.scrollTo({
          top: lineTop - scrollCenter + lineCenter,
          behavior: 'smooth',
        });
      }
    }
  }, [activeLineIndex]);

  return (
    <PlayerContainer>
      <ProgressBarContainer>
        <ProgressBar style={{ width: `${progress}%` }} />
      </ProgressBarContainer>
      <LyricsWrapper ref={lyricsWrapperRef}>
        {lyrics.map((line, index) => (
          <LyricLine key={index} className={activeLineIndex === index ? 'active-line' : ''}>
            {line.text || '\u00A0'}
          </LyricLine>
        ))}
      </LyricsWrapper>
    </PlayerContainer>
  );
}

export default Player;