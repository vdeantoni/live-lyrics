import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import Liricle from 'liricle';

const PlayerContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
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

const PlayerWrapper = styled.div`
  width: 100%;
  padding: 20px 0;
`;

const AudioPlayer = styled.audio`
  width: 100%;
`;

function Player({ song }) {
  const playerRef = useRef(null);
  const lyricsWrapperRef = useRef(null);
  const liricleRef = useRef(null);
  const [lyrics, setLyrics] = useState([]);
  const [activeLineIndex, setActiveLineIndex] = useState(null);

  useEffect(() => {
    if (!liricleRef.current) {
      liricleRef.current = new Liricle();

      liricleRef.current.on('load', data => {
        setLyrics(data.lines);
        setActiveLineIndex(null);
        if (lyricsWrapperRef.current) {
          lyricsWrapperRef.current.scrollTop = 0;
        }
      });

      liricleRef.current.on('sync', data => {
        setActiveLineIndex(data.index);
      });
    }

    return () => {
      if (liricleRef.current) {
        liricleRef.current.destroy();
        liricleRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (liricleRef.current && song) {
      setLyrics([]);
      setActiveLineIndex(null);
      liricleRef.current.load({ url: song.lrcUrl });
      if (playerRef.current) {
        playerRef.current.load();
      }
    }
  }, [song]);

  useEffect(() => {
    if (lyricsWrapperRef.current && activeLineIndex !== null) {
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

  const handleTimeUpdate = () => {
    if (liricleRef.current && playerRef.current) {
      const time = playerRef.current.currentTime;
      liricleRef.current.sync(time, false);
    }
  };

  return (
    <PlayerContainer>
      <LyricsWrapper ref={lyricsWrapperRef}>
        {lyrics.map((line, index) => (
          <LyricLine key={index} className={activeLineIndex === index ? 'active-line' : ''}>
            {line.text || '\u00A0'}
          </LyricLine>
        ))}
      </LyricsWrapper>
      <PlayerWrapper>
        <AudioPlayer ref={playerRef} src={song.audioUrl} controls onTimeUpdate={handleTimeUpdate} autoPlay/>
      </PlayerWrapper>
    </PlayerContainer>
  );
}

export default Player;