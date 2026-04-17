
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const DynamicBackground = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use useMemo to prevent re-calculating random values on every tiny render
  const orbs = useMemo(() => [
    { size: 300, duration: 45, delay: 0 },
    { size: 400, duration: 60, delay: 5 },
  ], []);

  if (!isClient) return <div id="background-neural" />;

  return (
    <>
      <div id="background-neural" />
      <div className="neural-mesh" />
      <div className="neural-grid" />
      
      {/* Extremely Optimized Energy Orbs */}
      <div className="fixed inset-0 z-[-8] overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/5 blur-[100px]"
            initial={{ 
              x: i === 0 ? "10%" : "70%", 
              y: i === 0 ? "20%" : "60%" 
            }}
            animate={{
              x: i === 0 ? ["10%", "80%", "10%"] : ["70%", "10%", "70%"],
              y: i === 0 ? ["20%", "70%", "20%"] : ["60%", "10%", "60%"],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: "linear",
              delay: orb.delay
            }}
            style={{
              width: orb.size + "px",
              height: orb.size + "px",
              willChange: "transform",
            }}
          />
        ))}
      </div>
      <div className="fixed inset-0 pointer-events-none -z-5 opacity-5 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </>
  );
};

export default DynamicBackground;
