import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import { FaPlay, FaStop } from 'react-icons/fa';

const DualCameraApp = () => {
  const frontWebcamRef = useRef(null);
  const backWebcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);

  const drawToCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (backWebcamRef.current?.video?.readyState === 4) {
        ctx.drawImage(backWebcamRef.current.video, 0, 0, canvas.width, canvas.height);
      } else {
        console.error('Back camera stream is not ready.');
      }

      if (frontWebcamRef.current?.video?.readyState === 4) {
        const smallWidth = canvas.width * 0.3;
        const smallHeight = (frontWebcamRef.current.video.videoHeight / frontWebcamRef.current.video.videoWidth) * smallWidth;
        ctx.drawImage(
          frontWebcamRef.current.video,
          canvas.width - smallWidth - 10,
          canvas.height - smallHeight - 10,
          smallWidth,
          smallHeight
        );
      } else {
        console.error('Front camera stream is not ready.');
      }

      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);
  };

  const startRecording = () => {
    console.log('Attempting to start recording...');
    setIsRecording(true);

    // Start drawing to canvas
    drawToCanvas();

    const canvasStream = canvasRef.current.captureStream(30);
    console.log('Canvas stream captured:', canvasStream);

    const newRecorder = new RecordRTC(canvasStream, { type: 'video' });

    newRecorder.startRecording(() => {
      console.log('Recording started successfully.');
    });

    setRecorder(newRecorder);
  };

  const stopRecording = () => {
    console.log('Attempting to stop recording...');
    setIsRecording(false);

    if (recorder) {
      recorder.stopRecording(() => {
        console.log('Recording stopped successfully.');
        invokeSaveAsDialog(recorder.getBlob(), 'dual-camera-video.webm');
        setRecorder(null);
      });
    } else {
      console.error('Recorder is not initialized.');
    }
  };

  useEffect(() => {
    console.log('Webcams initialized:', frontWebcamRef.current, backWebcamRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full rounded-lg shadow-lg bg-black"
      ></canvas>

      <Webcam
        ref={backWebcamRef}
        audio={false}
        videoConstraints={{ facingMode: { exact: 'environment' } }}
        style={{ display: 'none' }}
        onUserMediaError={(error) => console.error('Back camera error:', error)}
      />

      <Webcam
        ref={frontWebcamRef}
        audio={false}
        videoConstraints={{ facingMode: 'user' }}
        style={{ display: 'none' }}
        onUserMediaError={(error) => console.error('Front camera error:', error)}
      />

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
