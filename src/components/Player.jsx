import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import SilenceLoader from './SilenceLoader';

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
  margin-bottom: 10px;
  cursor: pointer;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
`;

const ControlButton = styled.button`
  background: none;
  border: 2px solid #007bff;
  color: #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 1.5em;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #007bff;
    color: white;
  }
`;

const TimeDisplay = styled.div`
  font-size: 1.2em;
  color: #555;
  min-width: 50px;
  text-align: center;
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
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &.active-line {
    opacity: 1;
    font-weight: 700;
    transform: scale(1.1);
  }
`;

const parseLrc = lrcText => {
    const lines = lrcText.split('\n');
    const parsedLines = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const milliseconds = parseInt(match[3], 10);
            const text = match[4].trim();
            const time = minutes * 60 + seconds + milliseconds / 1000;
            parsedLines.push({ time, text });
        }
    }

    if (parsedLines.length === 0) {
        return [];
    }

    const result = [];
    if (parsedLines[0].time > 0.5) {
        result.push({
            time: 0,
            text: '',
            isSilence: true,
            duration: parsedLines[0].time,
        });
    }

    for (let i = 0; i < parsedLines.length; i++) {
        const currentLine = parsedLines[i];
        if (currentLine.text === '') {
            let nextLineWithText = null;
            let nextLineWithTextIndex = -1;
            for (let j = i + 1; j < parsedLines.length; j++) {
                if (parsedLines[j].text !== '') {
                    nextLineWithText = parsedLines[j];
                    nextLineWithTextIndex = j;
                    break;
                }
            }

            if (nextLineWithText) {
                const duration = nextLineWithText.time - currentLine.time;
                if (duration > 0.1) {
                    result.push({
                        time: currentLine.time,
                        text: '',
                        isSilence: true,
                        duration: duration,
                    });
                }
                i = nextLineWithTextIndex - 1;
            } else {
                result.push(currentLine);
            }
        } else {
            result.push(currentLine);
        }
    }
    return result;
};

const formatTime = timeInSeconds => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function Player({ song }) {
    const lyricsWrapperRef = useRef(null);
    const progressBarRef = useRef(null);
    const intervalRef = useRef(null);
    const [lyrics, setLyrics] = useState([]);
    const [activeLineIndex, setActiveLineIndex] = useState(-1);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [totalDuration, setTotalDuration] = useState(0);

    // Effect for loading song data
    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setIsPlaying(false);

        if (song && song.lrcUrl) {
            fetch(song.lrcUrl)
                .then(res => res.text())
                .then(text => {
                    const parsedLyrics = parseLrc(text);
                    if (!parsedLyrics.length) {
                        setLyrics([]);
                        setProgress(0);
                        setActiveLineIndex(-1);
                        setCurrentTime(0);
                        setTotalDuration(0);
                        return;
                    }

                    setLyrics(parsedLyrics);
                    setTotalDuration(parsedLyrics.length > 0 ? parsedLyrics[parsedLyrics.length - 1].time : 0);
                    setActiveLineIndex(0);
                    setProgress(0);
                    setCurrentTime(0);
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.error('Error fetching lyrics:', error);
                    setLyrics([]);
                    setProgress(0);
                    setActiveLineIndex(-1);
                    setCurrentTime(0);
                    setTotalDuration(0);
                });
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [song]);

    // Effect for handling the playback timer
    useEffect(() => {
        if (isPlaying && currentTime < totalDuration) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(prevTime => {
                    const newTime = prevTime + 0.1;
                    if (newTime >= totalDuration) {
                        setIsPlaying(false);
                        return totalDuration;
                    }
                    return newTime;
                });
            }, 100);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isPlaying, currentTime, totalDuration]);

    // Effect for updating progress bar and active line based on currentTime
    useEffect(() => {
        const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
        setProgress(progressPercentage);

        let newActiveLineIndex = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (currentTime >= lyrics[i].time) {
                newActiveLineIndex = i;
            } else {
                break;
            }
        }
        setActiveLineIndex(newActiveLineIndex);
    }, [currentTime, lyrics, totalDuration]);

    // Effect for scrolling to the active line
    useEffect(() => {
        if (lyricsWrapperRef.current && activeLineIndex !== null && activeLineIndex >= 0 && lyrics[activeLineIndex]) {
            const activeLineElement = lyricsWrapperRef.current.children[activeLineIndex];
            if (activeLineElement) {
                const wrapperRect = lyricsWrapperRef.current.getBoundingClientRect();
                const scrollCenter = wrapperRect.height / 2;
                const lineTop = activeLineElement.offsetTop;
                const lineCenter = activeLineElement.offsetHeight / 2;

                lyricsWrapperRef.current.scrollTo({
                    top: lineTop - scrollCenter + lineCenter,
                    behavior: 'smooth',
                });
            }
        }
    }, [activeLineIndex, lyrics]);

    const togglePlay = () => {
        if (currentTime >= totalDuration && totalDuration > 0) return;
        setIsPlaying(!isPlaying);
    };

    const handleRestart = () => {
        setCurrentTime(0);
        setIsPlaying(true);
    };

    const handleSeek = (newTime) => {
        const clampedTime = Math.max(0, Math.min(newTime, totalDuration));
        setCurrentTime(clampedTime);
        if (!isPlaying && clampedTime < totalDuration) {
            setIsPlaying(true);
        }
    };

    const handleProgressBarClick = (e) => {
        if (progressBarRef.current) {
            const rect = progressBarRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * totalDuration;
            handleSeek(newTime);
        }
    };

    return (
        <PlayerContainer>
            <ProgressBarContainer ref={progressBarRef} onClick={handleProgressBarClick} data-testid="progress-bar-container">
                <ProgressBar style={{ width: `${progress}%` }} />
            </ProgressBarContainer>
            <ControlsContainer>
                <ControlButton onClick={handleRestart}>{"↩"}</ControlButton>
                <ControlButton onClick={togglePlay}>{isPlaying ? '❚❚' : '▶'}</ControlButton>
                <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
            </ControlsContainer>
            <LyricsWrapper ref={lyricsWrapperRef}>
                {lyrics.map((line, index) => {
                    if (line.isSilence) {
                        if (activeLineIndex === index) {
                            const remainingTime = (line.time + line.duration) - currentTime;
                            return <SilenceLoader key={index} remainingTime={remainingTime > 0 ? remainingTime : 0} />;
                        }
                        return <div key={index} style={{ height: '3em' }} />;
                    }
                    return (
                        <LyricLine
                            key={index}
                            className={activeLineIndex === index ? 'active-line' : ''}
                            onClick={() => handleSeek(line.time)}
                            data-testid={`lyric-line-${index}`}
                        >
                            {line.text || '\u00A0'}
                        </LyricLine>
                    );
                })}
            </LyricsWrapper>
        </PlayerContainer>
    );
}

export default Player;