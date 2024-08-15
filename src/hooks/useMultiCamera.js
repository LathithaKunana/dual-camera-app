import { useState, useEffect } from 'react';

const useMultiCamera = () => {
  const [devices, setDevices] = useState([]);
  const [frontCamera, setFrontCamera] = useState(null);
  const [backCamera, setBackCamera] = useState(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        const front = videoDevices.find(device => device.label.toLowerCase().includes('front'));
        const back = videoDevices.find(device => device.label.toLowerCase().includes('back'));

        setFrontCamera(front || videoDevices[0]);
        setBackCamera(back || videoDevices[videoDevices.length - 1]);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    getDevices();
  }, []);

  return { devices, frontCamera, backCamera };
};

export default useMultiCamera;