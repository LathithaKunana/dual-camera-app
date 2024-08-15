import { useState, useEffect } from 'react';

const useMultiCamera = () => {
  const [devices, setDevices] = useState([]);
  const [frontCamera, setFrontCamera] = useState(null);
  const [backCamera, setBackCamera] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        const front = videoDevices.find(device => device.label.toLowerCase().includes('front'));
        const back = videoDevices.find(device => device.label.toLowerCase().includes('back'));

        if (front && back) {
          // If both front and back cameras are available
          setFrontCamera(front);
          setBackCamera(back);
        } else if (front) {
          // Only front camera is available
          setFrontCamera(front);
        } else if (back) {
          // Only back camera is available
          setBackCamera(back);
        } else if (videoDevices.length > 0) {
          // If no front or back is found, use the first available camera
          setFrontCamera(videoDevices[0]);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
      }
    };

    getDevices();
  }, []);

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

  return {
    devices,
    frontCamera,
    backCamera,
    hasPermission,
    getFrontCameraStream,
    getBackCameraStream,
  };
};

export default useMultiCamera;
