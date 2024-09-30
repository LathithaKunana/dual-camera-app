import React, { useState, useRef, useEffect } from "react";
import { CameraIcon, DownloadIcon, EyeIcon } from "@heroicons/react/solid";
import CameraView from "../components/CameraView";
import VideoPreview from "../components/VideoPreview";
import useMultiCamera from "../hooks/useMultiCamera";
import useObjectDetection from "../hooks/useObjectDetection";
import axios from "axios";

const RecordingPage = ({ uploadedImages }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAddPopupsButton, setShowAddPopupsButton] = useState(false); // New state to show "Add Pop Ups"
  const [selectedImages, setSelectedImages] = useState([]); // Track selected images from sidebar
  const [error, setError] = useState(null);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(""); // Track processed video URL
  const [loading, setLoading] = useState(false);

  const { frontCamera, backCamera, getFrontCameraStream, getBackCameraStream } =
    useMultiCamera();
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
    if (recordingTime === 10) {
      showAlert();
    }
  }, [recordingTime]);

  const showAlert = () => {
    alert("15 seconds of recording completed!");
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
        mimeType: "video/webm",
      });

      mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      mediaRecorderRef.current.start();

      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);
    } else {
      console.error("Could not start recording: No camera streams available.");
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
    setShowAddPopupsButton(true); // Show the "Add Pop Ups" button once recording stops
    clearInterval(timerRef.current);
  };

  const handleDataAvailable = ({ data }) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  };

  const handleDownload = (url) => {
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "processed-video.webm"; // You can change the filename if needed
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddPopUps = async () => {
    setLoading(true); // Start loading

    setError(null); // Reset error state

    if (!uploadedImages || uploadedImages.length === 0) {
      setError("No images available for pop-ups. Please upload images first.");
      setLoading(false);
      return;
    }

    if (!recordedChunks || recordedChunks.length === 0) {
      setError("No video recorded. Please record a video first.");
      setLoading(false);
      return;
    }

    const videoDuration = recordingTime;
    const imageCount = Math.floor(videoDuration / 10);
    const selected = [];

    for (let i = 0; i < imageCount; i++) {
      const randomIndex = Math.floor(Math.random() * uploadedImages.length);
      selected.push(uploadedImages[randomIndex]);
    }

    setSelectedImages(selected);

    try {
      // Upload video to Cloudinary
      const videoFormData = new FormData();
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      videoFormData.append("file", blob);
      videoFormData.append("upload_preset", "rwba17nn");

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/dnryho2ce/video/upload`,
        videoFormData
      );

      const videoUrl = cloudinaryResponse.data.secure_url;
      console.log("Url of video:", videoUrl);

      // Send video URL and selected images to the backend
      const backendResponse = await axios.post(
        "http://localhost:5000/api/process-video",
        {
          videoUrl,
          images: selected,
          duration: videoDuration,
        }
      );

      // Set the processed video URL from backend
      const processedVideoUrl = backendResponse.data.processedVideoUrl;
      setProcessedVideoUrl(processedVideoUrl);

      // Show preview
      setPreviewUrl(processedVideoUrl);
      setShowPreview(true);
    } catch (error) {
      console.error("Error processing video:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    }
  }, [recordedChunks, isRecording]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
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
        <div className="absolute w-full h-1/2">
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
            isRecording ? "bg-red-500" : "bg-green-500"
          } text-white p-4 rounded-full`}
        >
          <CameraIcon className="h-8 w-8" />
        </button>
        {previewUrl && !isRecording && (
          <>
            <button
              onClick={() => handleDownload(previewUrl)}
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
        <VideoPreview
          videoUrl={previewUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

      {isRecording &&
        predictions.map((prediction, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${prediction.bbox[0]}px`,
              top: `${prediction.bbox[1]}px`,
              width: `${prediction.bbox[2]}px`,
              height: `${prediction.bbox[3]}px`,
              border: "2px solid red",
              backgroundColor: "rgba(255, 0, 0, 0.2)",
              zIndex: 10,
            }}
          >
            <p className="text-white">{prediction.class}</p>
          </div>
        ))}

      {showAddPopupsButton && (
        <button
          onClick={handleAddPopUps}
          className="absolute bottom-20 bg-indigo-600 text-white p-4 rounded-full"
          disabled={loading}
        >
          {loading ? (
            <div className="loader h-5 w-5 border-4 border-white border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            "Add Pop Ups"
          )}
        </button>
      )}
      {error && (
        <div className="absolute bottom-32 bg-red-500 text-white p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default RecordingPage;
