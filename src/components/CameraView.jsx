import React, { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const CameraView = ({ deviceId, isBackCamera }) => {
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    deviceId: deviceId,
  };

  const getVideo = useCallback(() => {
    return webcamRef.current ? webcamRef.current.video : null;
  }, []);

  return (
    <Webcam
      audio={false}
      ref={webcamRef}
      videoConstraints={videoConstraints}
      className={`${isBackCamera ? 'w-full h-full object-cover' : 'w-full h-full object-cover rounded-lg'}`}
    />
  );
};

export default CameraView;