
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudsProps {
  radius: number;
  speed: number;
  opacity: number;
  color: string;
}

const Clouds: React.FC<CloudsProps> = ({ radius, speed, opacity, color }) => {
  const cloudRef = useRef<THREE.Group>(null);
  const cloudRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += speed;
      cloudRef.current.rotation.z += speed * 0.5;
    }
  });

  return (
    <group ref={cloudRef}>
      <mesh ref={cloudRef2} scale={1.05}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Secondary cloud layer for depth */}
      <mesh scale={1.06} rotation={[Math.PI / 4, 0, 0]}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={opacity * 0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default Clouds;
