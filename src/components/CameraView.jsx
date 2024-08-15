import React, { forwardRef } from 'react';
import Webcam from 'react-webcam';

const CameraView = forwardRef(({ deviceId, isBackCamera }, ref) => {
  const videoConstraints = {
    width: 1280,
    height: 720,
    deviceId: deviceId,
  };

  return (
    <Webcam
      audio={false}
      ref={ref}
      videoConstraints={videoConstraints}
      className={`${isBackCamera ? 'w-full h-full object-cover' : 'w-full h-full object-cover rounded-lg'}`}
    />
  );
});

export default CameraView;