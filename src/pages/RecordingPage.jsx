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
  const [recordingTime, setRecordingTime] = useState(0);

  const { frontCamera, backCamera, getFrontCameraStream, getBackCameraStream } = useMultiCamera();
  const { detect, predictions } = useObjectDetection();

  const mediaRecorderRef = useRef(null);
  const backCameraRef = useRef(null);
  const frontCameraRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      if (backCameraRef.current) {
        detect(backCameraRef.current.video);
      }
      if (frontCameraRef.current) {
        detect(frontCameraRef.current.video);
      }
    }
  }, [isRecording, detect]);

  useEffect(() => {
    if (recordingTime === 15) {
      showAlert();
    }
  }, [recordingTime]);

  const showAlert = () => {
    alert('15 seconds of recording completed!');
  };

  const startRecording = async () => {
    setRecordedChunks([]);
    setIsRecording(true);
    setShowCamera(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setShowCamera(false);
    clearInterval(timerRef.current);
    // Note: We don't need to explicitly clear predictions as the useObjectDetection hook handles this
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="relative items-center justify-center flex h-screen bg-blue-950">
      <div className="flex p-6 items-center justify-center">
        <h1 className="text-4xl font-semibold text-center text-neutral-300">
          Collision Detector App
        </h1>
      </div>

      {showCamera && backCamera && (
        <CameraView
          deviceId={backCamera.deviceId}
          isBackCamera={true}
          ref={backCameraRef}
          className="absolute inset-0 w-full h-full"
        />
      )}
      {showCamera && frontCamera && (
        <div className="absolute w-1/2">
          <CameraView
            deviceId={frontCamera.deviceId}
            isBackCamera={false}
            ref={frontCameraRef}
          />
        </div>
      )}

      <div className="absolute bottom-4 flex space-x-4">
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

      {isRecording && (
        <div className="absolute flex top-5 bg-black text-white p-2 rounded">
          Recording Time: {formatTime(recordingTime)}
        </div>
      )}

      {showPreview && (
        <VideoPreview videoUrl={previewUrl} onClose={() => setShowPreview(false)} />
      )}

      {isRecording && predictions.map((prediction, index) => (
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