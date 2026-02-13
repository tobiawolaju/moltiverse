import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Person } from '../types';
import { latLngToVector3 } from '../services/geoUtils';
import { GLTFLobster } from '../models/GLTFLobster'; // Adjust path if needed if models moved. 
// Wait, I moved GLTFLobster.ts TO models? Yes. 
// But verify where GLTFLobster.ts is.

interface PersonMarkerProps {
    person: Person;
    radius: number;
    isSelected: boolean;
    onSelect: (person: Person) => void;
}

const SinglePersonMarker: React.FC<PersonMarkerProps> = ({ person, radius, isSelected, onSelect }) => {
    const groupRef = useRef<THREE.Group>(null);
    const [isVisible, setIsVisible] = useState(true);

    // Calculate surface position
    const surfacePos = useMemo(() =>
        latLngToVector3(person.location[0], person.location[1], radius),
        [person.location, radius]
    );

    // Instantiate GLTFLobster (imperative class) - creates THREE.Group
    const lobster = useMemo(() => {
        try {
            if (GLTFLobster.isReady('red')) {
                return GLTFLobster.createSync({ variant: 'red' });
            }
        } catch (e) {
            console.error("Failed to create lobster", e);
        }
        return null;
    }, []);

    // Configure lobster on mount / update
    useEffect(() => {
        if (lobster && person.color) {
            // Optional: Tinting logic if needed. 
        }

        return () => {
            if (lobster) lobster.dispose();
        }
    }, [lobster, person]);

    useFrame(({ camera, clock }, delta) => {
        if (!groupRef.current) return;

        // Visibility check (Horizon Culling)
        const cameraDir = camera.position.clone().normalize();
        const markerDir = surfacePos.clone().normalize();
        const dot = cameraDir.dot(markerDir);
        const nextVisible = dot > -0.15;

        if (nextVisible !== isVisible) {
            setIsVisible(nextVisible);
        }

        if (isVisible && lobster) {
            lobster.tick(delta);
        }
    });

    return (
        <group
            ref={groupRef}
            position={surfacePos}
            onUpdate={(self) => {
                // Orient to surface normal so Y-axis points away from center
                const normal = surfacePos.clone().normalize();
                const targetQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
                self.quaternion.copy(targetQ);
            }}
        >
            {isVisible && lobster && (
                <group
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(person);
                    }}
                >
                    {/* Render the imperative lobster group */}
                    <primitive object={lobster.group} />

                    {/* Selection Highlight (Ring) */}
                    {isSelected && (
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                            <ringGeometry args={[0.35, 0.40, 32]} />
                            <meshBasicMaterial color="white" side={THREE.DoubleSide} transparent opacity={0.6} />
                        </mesh>
                    )}

                    {/* Name tag */}
                    <Html
                        distanceFactor={12}
                        zIndexRange={isSelected ? [100, 110] : [0, 10]}
                        position={[0, 1.2, 0]} // Above the lobster
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
                </group>
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
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Preload the red lobster model
        // Path needs to be accessible from public.
        // In dev, /models works if models is in public/models? No, public is root.
        // So /models/lobster-base.glb if public/models/lobster-base.glb exists.
        GLTFLobster.preload('/models', 'red').then(() => {
            setLoaded(true);
        }).catch(err => {
            console.error("Failed to preload lobster models", err);
        });
    }, []);

    if (!loaded) return null;

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
