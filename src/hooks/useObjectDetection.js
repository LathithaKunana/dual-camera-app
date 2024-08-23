import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs'; // TensorFlow.js for running the model
import * as cocoSsd from '@tensorflow-models/coco-ssd'; // COCO-SSD model for object detection

const useObjectDetection = () => {
  // State to store the loaded model
  const [model, setModel] = useState(null);

  // State to store the predictions from the model
  const [predictions, setPredictions] = useState([]);

  // Reference to store the requestAnimationFrame ID
  const requestRef = useRef();

  // Effect to load the COCO-SSD model when the hook is first used
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load(); // Load the COCO-SSD model
        setModel(loadedModel); // Save the loaded model to state
      } catch (error) {
        console.error('Error loading COCO-SSD model:', error); // Handle any errors during model loading
      }
    };

    loadModel();

    // Cleanup function to cancel animation frame when the component unmounts
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Function to start detecting objects in a video element
  const detect = async (videoElement) => {
    if (model && videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      try {
        // Perform detection on the current video frame
        const newPredictions = await model.detect(videoElement);
        setPredictions(newPredictions); // Update the predictions state with the results

        // Check if any objects are colliding
        const hasCollision = checkCollisions(newPredictions);
        if (hasCollision) {
          console.log('Collision detected! Triggering vibration...');
          if (navigator.vibrate) {
            navigator.vibrate(200);  // Trigger device vibration for 200 milliseconds
          } else {
            console.warn('Vibration API not supported on this device.');
          }
        }

        // Request the next animation frame to keep detecting
        requestRef.current = requestAnimationFrame(() => detect(videoElement));
      } catch (error) {
        console.error('Error during object detection:', error); // Handle any errors during detection
      }
    } else {
      console.warn('Video element not ready or has invalid dimensions.');
      // Retry detection on the next animation frame if the video element is not ready
      requestRef.current = requestAnimationFrame(() => detect(videoElement));
    }
  };

  // Function to check for collisions between detected objects
  const checkCollisions = (predictions) => {
    for (let i = 0; i < predictions.length; i++) {
      for (let j = i + 1; j < predictions.length; j++) {
        if (doBoxesIntersect(predictions[i].bbox, predictions[j].bbox)) {
          return true; // Collision detected
        }
      }
    }
    return false; // No collisions detected
  };

  // Helper function to determine if two bounding boxes intersect (collision detection)
  const doBoxesIntersect = (box1, box2) => {
    return (
      box1[0] < box2[0] + box2[2] && // box1's left edge is to the left of box2's right edge
      box1[0] + box1[2] > box2[0] && // box1's right edge is to the right of box2's left edge
      box1[1] < box2[1] + box2[3] && // box1's top edge is above box2's bottom edge
      box1[1] + box1[3] > box2[1]    // box1's bottom edge is below box2's top edge
    );
  };

  return { detect, predictions }; // Return the detect function and predictions state
};

export default useObjectDetection;
