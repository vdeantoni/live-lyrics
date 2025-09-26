import React, { useState } from 'react';
import styled from 'styled-components';
import GlobalStyle from './styles/GlobalStyle';
import SongSelector from './components/SongSelector';
import Player from './components/Player';
import songs from './data/songs';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f0f0;
`;

function App() {
  const [selectedSong, setSelectedSong] = useState(songs[0]);

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        <SongSelector songs={songs} onSelectSong={setSelectedSong} selectedSong={selectedSong} />
        <Player song={selectedSong} />
      </AppContainer>
    </>
  );
}

export default App;