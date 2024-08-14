import React, { useEffect, useRef, useState } from 'react';
import { FaPlay, FaStop, FaDownload } from 'react-icons/fa';

const DualCameraApp = () => {
  const frontVideoRef = useRef(null);
  const backVideoRef = useRef(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function getCameras() {
      const frontStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      const backStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

      frontVideoRef.current.srcObject = frontStream;
      backVideoRef.current.srcObject = backStream;

      const combinedStream = new MediaStream([...frontStream.getTracks(), ...backStream.getTracks()]);
      const recorder = new MediaRecorder(combinedStream);
      
      recorder.ondataavailable = (e) => {
        setRecordedChunks((prev) => [...prev, e.data]);
      };

      setMediaRecorder(recorder);
    }

    getCameras();
  }, []);

  const startRecording = () => {
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
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
      <div className="relative w-full max-w-4xl">
        <video
          ref={backVideoRef}
          autoPlay
          muted
          className="w-full rounded-lg shadow-lg"
        ></video>
        <video
          ref={frontVideoRef}
          autoPlay
          muted
          className="absolute w-32 h-32 bottom-4 right-4 rounded-lg shadow-lg border-2 border-white"
        ></video>
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

        <button
          onClick={downloadVideo}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200"
        >
          <FaDownload className="mr-2" /> Download Video
        </button>
      </div>
    </div>
  );
};

export default DualCameraApp;
