import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, DownloadIcon, EyeIcon } from '@heroicons/react/solid'; // Icons for UI
import CameraView from '../components/CameraView'; // Component to display camera feed
import VideoPreview from '../components/VideoPreview'; // Component to show video preview
import useMultiCamera from '../hooks/useMultiCamera'; // Custom hook for handling multiple cameras
import useObjectDetection from '../hooks/useObjectDetection'; // Custom hook for object detection

const RecordingPage = () => {
  // State to manage recording status
  const [isRecording, setIsRecording] = useState(false);

  // State to store recorded video chunks
  const [recordedChunks, setRecordedChunks] = useState([]);

  // State to manage video preview URL
  const [previewUrl, setPreviewUrl] = useState('');

  // State to toggle video preview visibility
  const [showPreview, setShowPreview] = useState(false);

  // State to control camera view visibility
  const [showCamera, setShowCamera] = useState(false);

  // Hooks to get camera information and object detection functionality
  const { frontCamera, backCamera, getFrontCameraStream, getBackCameraStream } = useMultiCamera();
  const { detect, predictions } = useObjectDetection();

  // Refs to access the video elements for each camera
  const mediaRecorderRef = useRef(null);
  const backCameraRef = useRef(null);
  const frontCameraRef = useRef(null);

  // Effect to start object detection when recording starts
  useEffect(() => {
    if (isRecording && backCameraRef.current) {
      const videoElement = backCameraRef.current.video;
      videoElement.onloadeddata = () => {
        detect(videoElement);
      };
    }
    if (isRecording && frontCameraRef.current) {
      const videoElement = frontCameraRef.current.video;
      videoElement.onloadeddata = () => {
        detect(videoElement);
      };
    }
  }, [isRecording, detect]);

  // Function to start recording from both cameras
  const startRecording = async () => {
    setRecordedChunks([]);
    setIsRecording(true);
    setShowCamera(true);

    // Get streams from both cameras
    const backStream = await getBackCameraStream();
    const frontStream = await getFrontCameraStream();

    // Combine streams if both cameras are available
    let combinedStream;

    if (backStream && frontStream) {
      combinedStream = new MediaStream([
        ...backStream.getVideoTracks(),
        ...frontStream.getVideoTracks(),
      ]);
    } else if (backStream) {
      combinedStream = backStream;
    } else if (frontStream) {
      combinedStream = frontStream;
    }

    if (combinedStream) {
      // Initialize MediaRecorder with combined or single stream
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm',
      });

      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.start();

      // Automatically stop recording after 30 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);
    } else {
      console.error('Could not start recording: No camera streams available.');
      setIsRecording(false);
      setShowCamera(false);
    }
  };

  // Function to stop recording
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowCamera(false);
  };

  // Handler for storing recorded data chunks
  const handleDataAvailable = ({ data }) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  };

  // Function to handle video download
  const handleDownload = () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = 'recorded-video.webm';
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  };

  // Effect to update preview URL when recording stops and chunks are available
  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm',
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    }
  }, [recordedChunks, isRecording]);

  return (
    <div className="relative items-center justify-center flex h-screen bg-blue-950">
      <div className='flex p-6 items-center justify-center'>
        <h1 className='text-4xl font-semibold text-center text-neutral-300'>Collision Detector App</h1>
      </div>
      
      {/* Camera view components */}
      {showCamera && backCamera && (
        <CameraView
          deviceId={backCamera.deviceId}
          isBackCamera={true}
          ref={backCameraRef}
          className="absolute inset-0 w-full h-full"
        />
      )}
      {showCamera && frontCamera && (
        <div className="absolute w-full h-screen">
          <CameraView
            deviceId={frontCamera.deviceId}
            isBackCamera={false}
            ref={frontCameraRef}
          />
        </div>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex space-x-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`${
            isRecording ? 'bg-red-500' : 'bg-green-500'
          } text-white p-4 rounded-full`}
        >
          <CameraIcon className="h-8 w-8" />
        </button>
        {previewUrl && !isRecording && (
          <>
            <button
              onClick={handleDownload}
              className="bg-blue-500 text-white p-4 rounded-full"
            >
              <DownloadIcon className="h-8 w-8" />
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className="bg-yellow-500 text-white p-4 rounded-full"
            >
              <EyeIcon className="h-8 w-8" />
            </button>
          </>
        )}
      </div>

      {/* Video preview component */}
      {showPreview && (
        <VideoPreview
          videoUrl={previewUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Object detection predictions display */}
      {predictions.map((prediction, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${prediction.bbox[0]}px`,
            top: `${prediction.bbox[1]}px`,
            width: `${prediction.bbox[2]}px`,
            height: `${prediction.bbox[3]}px`,
            border: '2px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            zIndex: 10,
          }}
        >
          <p className="text-white">{prediction.class}</p>
        </div>
      ))}
    </div>
  );
};

export default RecordingPage;
