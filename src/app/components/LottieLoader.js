// app/components/LottieLoader.js
"use client";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

export default function LottieLoader() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Fetch the animation data from the public folder
    fetch("/loading.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Error loading animation:", error));
  }, []);

  if (!animationData) {
    return <div>Loading...</div>; // Or return null, or a placeholder
  }

  return <Lottie animationData={animationData} loop={true} />;
}