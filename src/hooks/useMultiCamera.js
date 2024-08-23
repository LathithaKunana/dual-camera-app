import { useState, useEffect } from 'react';

const useMultiCamera = () => {
  // State to store the list of all video input devices (cameras)
  const [devices, setDevices] = useState([]);
  
  // State to store the front and back camera devices separately
  const [frontCamera, setFrontCamera] = useState(null);
  const [backCamera, setBackCamera] = useState(null);

  // State to store whether the user has granted camera access permission
  const [hasPermission, setHasPermission] = useState(false);

  // useEffect to fetch and identify available camera devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission to access the user's camera
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        
        // Stop the video tracks immediately after getting permission
        stream.getTracks().forEach(track => track.stop());

        // Enumerate all media devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Filter the list to include only video input devices (cameras)
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        // Identify front and back cameras based on device labels
        const front = videoDevices.find(device => device.label.toLowerCase().includes('front'));
        const back = videoDevices.find(device => device.label.toLowerCase().includes('back'));

        if (front && back) {
          // Both front and back cameras are available
          setFrontCamera(front);
          setBackCamera(back);
        } else if (front) {
          // Only the front camera is available
          setFrontCamera(front);
        } else if (back) {
          // Only the back camera is available
          setBackCamera(back);
        } else if (videoDevices.length > 0) {
          // If neither front nor back is found, use the first available camera
          setFrontCamera(videoDevices[0]);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
      }
    };

    // Invoke the function to get devices
    getDevices();
  }, []);

  // Function to get the stream for the front camera
  const getFrontCameraStream = async () => {
    try {
      if (frontCamera) {
        return await navigator.mediaDevices.getUserMedia({ video: { deviceId: frontCamera.deviceId } });
      }
    } catch (error) {
      console.error('Error getting front camera stream:', error);
    }
    return null;
  };

  // Function to get the stream for the back camera
  const getBackCameraStream = async () => {
    try {
      if (backCamera) {
        return await navigator.mediaDevices.getUserMedia({ video: { deviceId: backCamera.deviceId } });
      }
    } catch (error) {
      console.error('Error getting back camera stream:', error);
    }
    return null;
  };

  // Return the state variables and functions for use in components
  return {
    devices,             // List of all available video input devices
    frontCamera,         // Front camera device, if available
    backCamera,          // Back camera device, if available
    hasPermission,       // Whether the user has granted camera access permission
    getFrontCameraStream, // Function to get the front camera stream
    getBackCameraStream,  // Function to get the back camera stream
  };
};

export default useMultiCamera;
