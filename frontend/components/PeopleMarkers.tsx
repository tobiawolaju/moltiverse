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
                        position={[0, 1.8, 0]} // Above the lobster
                    >
                        <div
                            className={`px-3 py-2 rounded-lg text-[9px] whitespace-nowrap pointer-events-none select-none transition-all duration-300 border backdrop-blur-md ${isSelected
                                ? "bg-white/95 text-black border-white shadow-2xl scale-110"
                                : "bg-black/80 border-white/10"
                                }`}
                            style={{
                                color: isSelected ? undefined : person.color,
                                boxShadow: isSelected
                                    ? '0 0 20px rgba(255, 255, 255, 0.4)'
                                    : `0 0 15px ${person.color}22`,
                                textShadow: isSelected ? 'none' : `0 0 5px ${person.color}88`
                            }}
                        >
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <span className={`${isSelected ? 'text-black/40' : 'text-white/40'} font-mono`}>ID//</span>
                                    <span className="font-bold tracking-tight">{person.name.toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${person.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : (isSelected ? 'bg-black/20' : 'bg-white/20')}`} />
                                    <span className={`uppercase tracking-[0.2em] text-[6px] ${person.status === 'online' ? 'text-green-500' : (isSelected ? 'text-black/30' : 'text-white/30')}`}>
                                        {person.status || 'OFFLINE'}
                                    </span>
                                </div>
                                {person.activity && (
                                    <div className="mt-0.5 pt-1 border-t border-white/5">
                                        <span className={`text-[7px] italic ${isSelected ? 'text-black/60' : 'text-white/60'}`}>
                                            {person.activity}
                                        </span>
                                    </div>
                                )}
                            </div>
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
