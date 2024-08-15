import React, { useState, useRef, useEffect } from 'react';
import { FiCamera, FiDownload } from 'react-icons/fi';
import CameraView from '../components/CameraView';
import VideoPreview from '../components/VideoPreview';
import useMultiCamera from '../hooks/useMultiCamera';
import useObjectDetection from '../hooks/useObjectDetection';

const RecordingPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { frontCamera, backCamera } = useMultiCamera();
  const { detect, predictions } = useObjectDetection();

  const mediaRecorderRef = useRef(null);
  const backCameraRef = useRef(null);
  const frontCameraRef = useRef(null);

  useEffect(() => {
    if (isRecording && backCameraRef.current) {
      detect(backCameraRef.current);
    }
  }, [isRecording, detect]);

  const startRecording = async () => {
    setRecordedChunks([]);
    setIsRecording(true);
  
    try {
      const backStream = backCameraRef.current?.srcObject;
      const frontStream = frontCameraRef.current?.srcObject;
  
      if (!backStream || !frontStream) {
        console.error('Camera streams not ready');
        setIsRecording(false);
        return;
      }
  
      const combinedStream = new MediaStream([
        ...backStream.getVideoTracks(),
        ...frontStream.getVideoTracks()
      ]);
  
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm',
      });
  
      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.start();
  
      // Stop recording after 30 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
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
    {backCamera && (
      <div className="absolute inset-0">
        <CameraView
          deviceId={backCamera.deviceId}
          isBackCamera={true}
          ref={backCameraRef}
        />
      </div>
    )}
    
    <div className="absolute top-4 right-4 w-1/3 h-1/3 z-10">
      {frontCamera && (
        <CameraView
          deviceId={frontCamera.deviceId}
          isBackCamera={false}
          ref={frontCameraRef}
        />
      )}
    </div>
      
      <div className="absolute bottom-4 right-4 flex space-x-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`${
            isRecording ? 'bg-red-500' : 'bg-green-500'
          } text-white p-4 rounded-full`}
        >
          <FiCamera className="h-8 w-8" />
        </button>
        {previewUrl && (
          <button
            onClick={handleDownload}
            className="bg-blue-500 text-white p-4 rounded-full"
          >
            <FiDownload className="h-8 w-8" />
          </button>
        )}
      </div>

      {showPreview && (
        <VideoPreview
          videoUrl={previewUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Render bounding boxes for detected objects */}
      {predictions.map((prediction, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: prediction.bbox[0],
            top: prediction.bbox[1],
            width: prediction.bbox[2],
            height: prediction.bbox[3],
            border: '2px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            zIndex: 10,
          }}
        />
      ))}
    </div>
  );
};

export default RecordingPage;