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

  const detect = async (video) => {
    if (model && video) {
      try {
        const newPredictions = await model.detect(video);
        setPredictions(newPredictions);

        // Check for collisions and trigger vibration
        const hasCollision = checkCollisions(newPredictions);
        if (hasCollision) {
          navigator.vibrate(200);
        }

        requestRef.current = requestAnimationFrame(() => detect(video));
      } catch (error) {
        console.error('Error during object detection:', error);
      }
    }
  };

  const checkCollisions = (predictions) => {
    const targetObjects = ['person', 'sports ball', 'soccer ball'];
    const detectedObjects = predictions.filter(p => targetObjects.includes(p.class));

    for (let i = 0; i < detectedObjects.length; i++) {
      for (let j = i + 1; j < detectedObjects.length; j++) {
        if (doBoxesIntersect(detectedObjects[i].bbox, detectedObjects[j].bbox)) {
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