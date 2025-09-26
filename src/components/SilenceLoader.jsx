import React from 'react';
import styled, { keyframes } from 'styled-components';

const ldsEllipsis1 = keyframes`
  0% { transform: scale(0); }
  100% { transform: scale(1); }
`;

const ldsEllipsis2 = keyframes`
  0% { transform: translate(0, 0); }
  100% { transform: translate(24px, 0); }
`;

const ldsEllipsis3 = keyframes`
  0% { transform: scale(1); }
  100% { transform: scale(0); }
`;

const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1.5em;
`;

const Ellipsis = styled.div`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;

  div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #888;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }

  div:nth-child(1) {
    left: 8px;
    animation: ${ldsEllipsis1} 0.6s infinite;
  }
  div:nth-child(2) {
    left: 8px;
    animation: ${ldsEllipsis2} 0.6s infinite;
  }
  div:nth-child(3) {
    left: 32px;
    animation: ${ldsEllipsis2} 0.6s infinite;
  }
  div:nth-child(4) {
    left: 56px;
    animation: ${ldsEllipsis3} 0.6s infinite;
  }
`;

const TimeRemaining = styled.div`
  margin-top: 20px;
`;

const SilenceLoader = ({ remainingTime }) => {
  return (
    <LoaderContainer>
      <Ellipsis>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </Ellipsis>
      <TimeRemaining>
        Silence: {Math.ceil(remainingTime)}s remaining
      </TimeRemaining>
    </LoaderContainer>
  );
};

export default SilenceLoader;