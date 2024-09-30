import React, { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { FaPlay, FaStop } from 'react-icons/fa';

const DualCameraApp = () => {
  // Ref to access the Camera component and its stream
  const cameraRef = useRef(null);
  
  // State to manage the recording status
  const [isRecording, setIsRecording] = useState(false);
  
  // State to store chunks of recorded video data
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  // State to manage the MediaRecorder instance
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Function to start recording from the camera
  const startRecording = () => {
    // Get the camera stream from the Camera component
    const stream = cameraRef.current?.getCameraStream();
    
    if (!stream) {
      console.error("Failed to get camera stream.");
      return;
    }

    // Create a new MediaRecorder instance to record the video stream
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    // Event handler for when data is available from the recorder
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    // Event handler for when recording stops
    recorder.onstop = () => {
      // Create a Blob from the recorded chunks and generate a download URL
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element to download the recorded video
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dual-camera-video.webm';
      a.click();
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    };

    // Start recording and save the MediaRecorder instance
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  // Function to stop recording
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
        {/* Camera component for accessing the user's camera */}
        <Camera
          ref={cameraRef}
          facingMode="user" // Set the camera to the user's default (usually front-facing)
          numberOfCamerasCallback={(availableCameras) => console.log('Available cameras:', availableCameras)}
          aspectRatio="cover" // Ensure the camera view covers the entire container
          errorMessages={{
            noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
            permissionDenied: 'Permission denied. Please refresh and give camera permission.',
          }}
          className="rounded-lg shadow-lg bg-black"
        />
      </div>

      <div className="flex space-x-4 mt-6">
        {/* Button to start or stop recording based on the recording state */}
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
