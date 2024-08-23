import React, { forwardRef } from 'react';
import Webcam from 'react-webcam';

// CameraView component to display the video feed from the webcam
const CameraView = forwardRef(({ deviceId, isBackCamera }, ref) => {
  // Video constraints for the webcam feed
  const videoConstraints = {
    width: 1280,  // Set video width
    height: 720,  // Set video height
    deviceId: deviceId,  // Set device ID for selecting the specific camera
  };

  return (
    <Webcam
      audio={false}  // Disable audio
      ref={ref}  // Forward ref to access the webcam instance
      videoConstraints={videoConstraints}  // Apply video constraints
      className={`${isBackCamera ? 'w-full h-full object-cover' : 'w-full h-full object-cover rounded-lg'}`}  // Apply conditional styling
    />
  );
});

export default CameraView;
