
import React, { useRef, useState, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Person } from '../types';
import { latLngToVector3 } from '../services/geoUtils';

interface PersonMarkerProps {
  person: Person;
  radius: number;
  isSelected: boolean;
  onSelect: (person: Person) => void;
}

const SinglePersonMarker: React.FC<PersonMarkerProps> = ({ person, radius, isSelected, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.Mesh>(null);
  const [isVisible, setIsVisible] = useState(true);

  const extrusionHeight = (person.height || 0) * 0.6;
  const surfacePos = useMemo(() =>
    latLngToVector3(person.location[0], person.location[1], radius),
    [person.location, radius]
  );

  const coneHeight = 0.2;
  const coneRadius = 0.06;

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return;

    // Visibility check (Horizon Culling)
    const cameraDir = camera.position.clone().normalize();
    const markerDir = surfacePos.clone().normalize();
    const dot = cameraDir.dot(markerDir);
    const nextVisible = dot > -0.15;

    if (nextVisible !== isVisible) {
      setIsVisible(nextVisible);
    }

    // Subtler pulsing outline effect if selected
    if (isSelected && outlineRef.current) {
      const s = 1.02 + Math.sin(clock.elapsedTime * 6) * 0.02;
      outlineRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      ref={groupRef}
      position={surfacePos}
      onUpdate={(self) => {
        self.lookAt(0, 0, 0);
      }}
    >
      {isVisible && (
        <>
          {/* Main Character Model (Cone) */}
          <mesh
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(person);
            }}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, -coneHeight / 2]}
          >
            <coneGeometry args={[coneRadius, coneHeight, 8]} />
            <meshBasicMaterial color={person.color} />
          </mesh>

          {/* Subtler Focus Outline (White wireframe around the cone only) */}
          {isSelected && (
            <mesh
              ref={outlineRef}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, -coneHeight / 2]}
            >
              <coneGeometry args={[coneRadius * 1.08, coneHeight * 1.05, 8]} />
              <meshBasicMaterial
                color="white"
                wireframe
                transparent
                opacity={0.3}
                depthTest={false}
              />
            </mesh>
          )}

          {/* Name tag - Always visible, style changes on selection */}
          <Html
            distanceFactor={12}
            zIndexRange={isSelected ? [100, 110] : [0, 10]}
            position={[0, 0, -coneHeight - 0.15]}
          >
            <div
              className={`px-2 py-1 rounded-sm text-[9px] whitespace-nowrap pointer-events-none select-none transition-all duration-300 border ${isSelected
                  ? "bg-white text-black border-black font-bold"
                  : "bg-black/95 border-white/10"
                }`}
              style={{
                color: isSelected ? undefined : person.color,
                boxShadow: isSelected
                  ? '0 0 20px rgba(255, 255, 255, 0.4)'
                  : `0 0 15px ${person.color}22`,
                textShadow: isSelected ? 'none' : `0 0 5px ${person.color}88`
              }}
            >
              <span className={`${isSelected ? 'text-black/40' : 'opacity-50'} mr-1`}>ID//</span>
              {person.name.toUpperCase()}
            </div>
          </Html>

          <mesh position={[0, 0, extrusionHeight / 2]}>
            <cylinderGeometry args={[0.003, 0.003, extrusionHeight, 8]} />
            <meshBasicMaterial color={isSelected ? 'white' : person.color} transparent opacity={isSelected ? 0.3 : 0.15} />
          </mesh>
        </>
      )}
    </group>
  );
};

interface PeopleMarkersProps {
  people: Person[];
  radius: number;
  selectedPersonId: string | null;
  onSelect: (person: Person) => void;
}

const PeopleMarkers: React.FC<PeopleMarkersProps> = ({ people, radius, selectedPersonId, onSelect }) => {
  return (
    <group>
      {people.map((person) => (
        <SinglePersonMarker
          key={person.id}
          person={person}
          radius={radius}
          isSelected={selectedPersonId === person.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
};

export default PeopleMarkers;
