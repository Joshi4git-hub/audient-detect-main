import { useState, useEffect, useRef } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export const useObjectDetection = () => {
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detections, setDetections] = useState<DetectedObject[]>([]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load model:', error);
        setIsLoading(false);
      }
    };
    loadModel();
  }, []);

  const detect = async (videoElement: HTMLVideoElement) => {
    if (!model || !videoElement) return [];

    try {
      const predictions = await model.detect(videoElement);
      const detected = predictions.map(pred => ({
        class: pred.class,
        score: pred.score,
        bbox: pred.bbox
      }));
      setDetections(detected);
      return detected;
    } catch (error) {
      console.error('Detection error:', error);
      return [];
    }
  };

  return {
    model,
    isLoading,
    detections,
    detect
  };
};
