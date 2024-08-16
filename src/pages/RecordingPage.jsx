// RecordingPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, DownloadIcon, EyeIcon } from '@heroicons/react/solid';
import CameraView from '../components/CameraView';
import VideoPreview from '../components/VideoPreview';
import useMultiCamera from '../hooks/useMultiCamera';
import useObjectDetection from '../hooks/useObjectDetection';


const RecordingPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const { frontCamera, backCamera, getFrontCameraStream, getBackCameraStream } = useMultiCamera();
  const { detect, predictions } = useObjectDetection();

  const mediaRecorderRef = useRef(null);
  const backCameraRef = useRef(null);
  const frontCameraRef = useRef(null);

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

  const startRecording = async () => {
    setRecordedChunks([]);
    setIsRecording(true);
    setShowCamera(true);

    const backStream = await getBackCameraStream();
    const frontStream = await getFrontCameraStream();

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
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm',
      });

      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.start();

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

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setShowCamera(false);
  };

  const handleDataAvailable = ({ data }) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  };

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
    <div className="relative h-screen">
      {showCamera && backCamera && (
        <CameraView
          deviceId={backCamera.deviceId}
          isBackCamera={true}
          ref={backCameraRef}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {showCamera && frontCamera && (
        <div className="absolute bottom-4 left-4 w-1/4 h-1/4">
          <CameraView
            deviceId={frontCamera.deviceId}
            isBackCamera={false}
            ref={frontCameraRef}
          />
        </div>
      )}

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

      {showPreview && (
        <VideoPreview
          videoUrl={previewUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

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
