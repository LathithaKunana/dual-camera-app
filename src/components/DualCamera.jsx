import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaStop, FaDownload } from 'react-icons/fa';

const DualCameraApp = () => {
  const frontVideoRef = useRef(null);
  const backVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function getCameras() {
      const frontStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const backStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

      frontVideoRef.current.srcObject = frontStream;
      backVideoRef.current.srcObject = backStream;

      // Setup canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Update canvas to draw videos
      function drawVideos() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw back camera full screen
        ctx.drawImage(backVideoRef.current, 0, 0, canvas.width, canvas.height);

        // Draw front camera in bottom-right corner
        const smallWidth = canvas.width * 0.3;
        const smallHeight = (frontVideoRef.current.videoHeight / frontVideoRef.current.videoWidth) * smallWidth;
        ctx.drawImage(
          frontVideoRef.current,
          canvas.width - smallWidth - 10,
          canvas.height - smallHeight - 10,
          smallWidth,
          smallHeight
        );

        requestAnimationFrame(drawVideos);
      }

      drawVideos();

      // Record canvas
      const stream = canvas.captureStream();
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        setRecordedChunks((prev) => [...prev, e.data]);
      };

      setMediaRecorder(recorder);
    }

    getCameras();
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setRecordedChunks([]); // Reset recorded chunks
    mediaRecorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorder.stop();
  };

  const downloadVideo = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'dual-camera-video.webm';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full rounded-lg shadow-lg"
      ></canvas>
      
      <video ref={backVideoRef} style={{ display: 'none' }}></video>
      <video ref={frontVideoRef} style={{ display: 'none' }}></video>

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

        <button
          onClick={downloadVideo}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
          disabled={recordedChunks.length === 0}
        >
          <FaDownload className="mr-2" /> Download Video
        </button>
      </div>
    </div>
  );
};

export default DualCameraApp;
