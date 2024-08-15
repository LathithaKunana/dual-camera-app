import React, { useRef, useState } from 'react';
import {Camera} from 'react-camera-pro';
import { FaPlay, FaStop } from 'react-icons/fa';

const DualCameraApp = () => {
  const cameraRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = () => {
    const stream = cameraRef.current?.getCameraStream();
    
    if (!stream) {
      console.error("Failed to get camera stream.");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dual-camera-video.webm';
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      console.error("No media recorder initialized.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="relative w-full max-w-2xl mx-auto aspect-w-16 aspect-h-9">
        <Camera
          ref={cameraRef}
          facingMode="user"
          numberOfCamerasCallback={(availableCameras) => console.log('Available cameras:', availableCameras)}
          aspectRatio="cover"
          errorMessages={{
            noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
            permissionDenied: 'Permission denied. Please refresh and give camera permission.',
          }}
          className="rounded-lg shadow-lg bg-black"
        />
      </div>

      <div className="flex space-x-4 mt-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200"
          >
            <FaPlay className="mr-2" /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
          >
            <FaStop className="mr-2" /> Stop Recording
          </button>
        )}
      </div>
    </div>
  );
};

export default DualCameraApp;
