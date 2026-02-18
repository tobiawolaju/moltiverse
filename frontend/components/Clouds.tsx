
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudsProps {
  radius: number;
  speed: number;
  opacity: number;
  color: string;
  theme: 'dark' | 'light';
}

const Clouds: React.FC<CloudsProps> = ({ radius, speed, opacity, color, theme }) => {
  const cloudRef = useRef<THREE.Group>(null);
  const isLight = theme === 'light';

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += speed;
      cloudRef.current.rotation.z += speed * 0.5;
    }
  });

  return (
    <group ref={cloudRef}>
      <mesh scale={1.05}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color={isLight ? "#ffffff" : color}
          transparent
          opacity={isLight ? opacity * 0.4 : opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </mesh>
      {/* Secondary cloud layer for depth */}
      <mesh scale={1.06} rotation={[Math.PI / 4, 0, 0]}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial
          color={isLight ? "#ffffff" : color}
          transparent
          opacity={isLight ? opacity * 0.2 : opacity * 0.5}
          depthWrite={false}
          blending={isLight ? THREE.NormalBlending : THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default Clouds;
