
import React from 'react';
import * as THREE from 'three';
import { SeaConfig } from '../types';
import { latLngToVector3 } from '../services/geoUtils';

interface SeasProps {
  seas: SeaConfig[];
  radius: number;
}

const Seas: React.FC<SeasProps> = ({ seas, radius }) => {
  return (
    <group>
      {seas.map((sea) => {
        const position = latLngToVector3(sea.location[0], sea.location[1], radius + 0.01);
        
        // We use a circle geometry that follows the curvature slightly or just sits flush
        return (
          <mesh key={sea.id} position={position} lookAt={new THREE.Vector3(0,0,0)}>
            <circleGeometry args={[sea.size, 32]} />
            <meshStandardMaterial 
              color={sea.color} 
              transparent 
              opacity={0.8}
              roughness={0.1}
              metalness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default Seas;
