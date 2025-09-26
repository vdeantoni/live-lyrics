import React from 'react';
import styled from 'styled-components';

const SongSelectorContainer = styled.div`
  padding: 20px;
  background-color: #fff;
  border-bottom: 1px solid #ccc;
`;

const SongList = styled.ul`
  list-style: none;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
`;

const SongItem = styled.li`
  cursor: pointer;
  font-size: 1.2em;
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  color: ${({ active }) => (active ? '#007bff' : '#333')};
  white-space: nowrap;
  &:hover {
    color: #007bff;
  }
`;

function SongSelector({ songs, onSelectSong, selectedSong }) {
  return (
    <SongSelectorContainer>
      <SongList>
        {songs.map(song => (
          <SongItem
            key={song.id}
            active={selectedSong.id === song.id}
            onClick={() => onSelectSong(song)}
          >
            {song.title}
          </SongItem>
        ))}
      </SongList>
    </SongSelectorContainer>
  );
}

export default SongSelector;