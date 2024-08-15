import { useState, useEffect } from 'react';

const useMultiCamera = () => {
  const [devices, setDevices] = useState([]);
  const [frontCamera, setFrontCamera] = useState(null);
  const [backCamera, setBackCamera] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // First, ask for permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        
        // Stop the stream immediately after getting permission
        stream.getTracks().forEach(track => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        const front = videoDevices.find(device => device.label.toLowerCase().includes('front'));
        const back = videoDevices.find(device => device.label.toLowerCase().includes('back'));

        setFrontCamera(front || videoDevices[0]);
        setBackCamera(back || (videoDevices.length > 1 ? videoDevices[1] : videoDevices[0]));
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
      }
    };

    getDevices();
  }, []);

  return { devices, frontCamera, backCamera, hasPermission };
};

export default useMultiCamera;