// useObjectDetection.js
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const useObjectDetection = () => {
  const [model, setModel] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const requestRef = useRef();

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
      } catch (error) {
        console.error('Error loading COCO-SSD model:', error);
      }
    };

    loadModel();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const detect = async (videoElement) => {
    if (model && videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      try {
        const newPredictions = await model.detect(videoElement);
        setPredictions(newPredictions);

        // Check for collisions
        const hasCollision = checkCollisions(newPredictions);
        if (hasCollision) {
          // Trigger vibration on collision
          navigator.vibrate(200);
        }

        requestRef.current = requestAnimationFrame(() => detect(videoElement));
      } catch (error) {
        console.error('Error during object detection:', error);
      }
    } else {
      console.warn('Video element not ready or has invalid dimensions.');
      requestRef.current = requestAnimationFrame(() => detect(videoElement));
    }
  };

  const checkCollisions = (predictions) => {
    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        if (doBoxesIntersect(predictions[i].bbox, predictions[j].bbox)) {
          return true;
        }
      }
    }
    return false;
  };

  const doBoxesIntersect = (box1, box2) => {
    return (
      box1[0] < box2[0] + box2[2] &&
      box1[0] + box1[2] > box2[0] &&
      box1[1] < box2[1] + box2[3] &&
      box1[1] + box1[3] > box2[1]
    );
  };

  return { detect, predictions };
};

export default useObjectDetection;
