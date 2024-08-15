import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import RecordRTC, { invokeSaveAsDialog } from 'recordrtc';
import { FaPlay, FaStop, FaDownload } from 'react-icons/fa';

const DualCameraApp = () => {
  const frontWebcamRef = useRef(null);
  const backWebcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);

  const startRecording = async () => {
    setIsRecording(true);

    // Setup recording streams for both cameras
    const frontStream = await frontWebcamRef.current.video.srcObject;
    const backStream = await backWebcamRef.current.video.srcObject;

    // Setup canvas drawing
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawVideos = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backWebcamRef.current.video, 0, 0, canvas.width, canvas.height);
      const smallWidth = canvas.width * 0.3;
      const smallHeight = (frontWebcamRef.current.video.videoHeight / frontWebcamRef.current.video.videoWidth) * smallWidth;
      ctx.drawImage(
        frontWebcamRef.current.video,
        canvas.width - smallWidth - 10,
        canvas.height - smallHeight - 10,
        smallWidth,
        smallHeight
      );
      requestAnimationFrame(drawVideos);
    };

    requestAnimationFrame(drawVideos);

    // Create combined stream from the canvas
    const combinedStream = canvas.captureStream();

    const newRecorder = new RecordRTC(combinedStream, { type: 'video' });
    newRecorder.startRecording();
    setRecorder(newRecorder);
  };

  const stopRecording = () => {
    setIsRecording(false);
    recorder.stopRecording(() => {
      invokeSaveAsDialog(recorder.getBlob(), 'dual-camera-video.webm');
      setRecorder(null);
    });
  };

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
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: { exact: 'environment' } }}
        style={{ display: 'none' }}
      />

      <Webcam
        ref={frontWebcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: 'user' }}
        style={{ display: 'none' }}
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
