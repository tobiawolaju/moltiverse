
import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import PlanetSurface from './PlanetSurface';
import PeopleMarkers from './PeopleMarkers';
import Clouds from './Clouds';
import Seas from './Seas';
import Transactions from './Transactions';
import { MapData, Person, PlanetConfig, Transaction } from '../types';
import { latLngToVector3 } from '../services/geoUtils';

const DitherShader = {
  uniforms: {
    colorA: { value: new THREE.Color("#836EF9") },
    colorB: { value: new THREE.Color("#1a0033") },
    lightPos: { value: new THREE.Vector3(10, 10, 10) }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform vec3 lightPos;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    float dither(vec2 uv, float brightness) {
      int x = int(mod(uv.x, 4.0));
      int y = int(mod(uv.y, 4.0));
      int index = x + y * 4;
      float threshold = 0.0;
      if (index == 0) threshold = 0.0;
      else if (index == 1) threshold = 8.0;
      else if (index == 2) threshold = 2.0;
      else if (index == 3) threshold = 10.0;
      else if (index == 4) threshold = 12.0;
      else if (index == 5) threshold = 4.0;
      else if (index == 6) threshold = 14.0;
      else if (index == 7) threshold = 6.0;
      else if (index == 8) threshold = 3.0;
      else if (index == 9) threshold = 11.0;
      else if (index == 10) threshold = 1.0;
      else if (index == 11) threshold = 9.0;
      else if (index == 12) threshold = 15.0;
      else if (index == 13) threshold = 7.0;
      else if (index == 14) threshold = 13.0;
      else if (index == 15) threshold = 5.0;
      return brightness > (threshold / 16.0) ? 1.0 : 0.0;
    }

    void main() {
      vec3 lightDir = normalize(lightPos - vWorldPosition);
      float diff = max(dot(vNormal, lightDir), 0.0);
      float isBright = dither(gl_FragCoord.xy, diff);
      vec3 finalColor = mix(colorB, colorA, isBright);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

interface FocusControllerProps {
  selectedPerson: Person | null;
  radius: number;
}

const FocusController: React.FC<FocusControllerProps> = ({ selectedPerson, radius }) => {
  const { camera, controls } = useThree() as any;
  const currentSpherical = useRef(new THREE.Spherical());
  const targetSpherical = useRef(new THREE.Spherical());
  const isMoving = useRef(false);

  useEffect(() => {
    if (selectedPerson) {
      // Calculate target position vector
      const pos = latLngToVector3(
        selectedPerson.location[0],
        selectedPerson.location[1],
        radius
      );
      // Map that position to spherical coordinates (phi, theta)
      targetSpherical.current.setFromVector3(pos);
      isMoving.current = true;
      if (controls) controls.autoRotate = false;
    } else {
      isMoving.current = false;
      if (controls) controls.autoRotate = true;
    }
  }, [selectedPerson, radius, controls]);

  useFrame((state, delta) => {
    if (!controls) return;

    // Fixed pivot point (Planet Center)
    controls.target.set(0, 0, 0);

    if (selectedPerson && isMoving.current) {
      // Capture current distance and spherical state
      const currentDist = camera.position.length();
      currentSpherical.current.setFromVector3(camera.position);

      // Handle shortest-path rotation for the azimuth (theta)
      let targetTheta = targetSpherical.current.theta;
      const currentTheta = currentSpherical.current.theta;
      const diff = targetTheta - currentTheta;

      if (diff > Math.PI) targetTheta -= 2 * Math.PI;
      if (diff < -Math.PI) targetTheta += 2 * Math.PI;

      // Smoothly interpolate the angles
      currentSpherical.current.phi = THREE.MathUtils.lerp(
        currentSpherical.current.phi,
        targetSpherical.current.phi,
        delta * 5.0
      );
      currentSpherical.current.theta = THREE.MathUtils.lerp(
        currentTheta,
        targetTheta,
        delta * 5.0
      );

      // CRITICAL: Keep radius identical to current zoom distance to prevent "dipping" zoom effect
      currentSpherical.current.radius = currentDist;

      // Update camera from new spherical coordinates
      camera.position.setFromSpherical(currentSpherical.current);

      // Release control if transition is complete
      const angleRemaining = Math.abs(currentSpherical.current.phi - targetSpherical.current.phi) +
        Math.abs(targetTheta - currentSpherical.current.theta);
      if (angleRemaining < 0.005) {
        isMoving.current = false;
      }
    }

    controls.update();
  });

  return null;
};

interface GlobeProps {
  mapData: MapData;
  people: Person[];
  transactions: Transaction[];
  planetConfig: PlanetConfig;
  selectedPerson: Person | null;
  onSelectPerson: (person: Person | null) => void;
}

const Globe: React.FC<GlobeProps> = ({ mapData, people, transactions, planetConfig, selectedPerson, onSelectPerson }) => {
  // Use radius from config, default to 5 if not present
  const RADIUS = (planetConfig as any).radius || 5;

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      ...DitherShader,
      uniforms: {
        ...DitherShader.uniforms,
        colorA: { value: new THREE.Color(planetConfig.atmosphereColor || "#836EF9") },
        colorB: { value: new THREE.Color(planetConfig.baseColor || "#1a0033") },
      }
    });
  }, [planetConfig]);

  return (
    <div className="w-full h-screen bg-black" onClick={() => onSelectPerson(null)}>
      <Canvas dpr={[1, 2]} gl={{ antialias: false }}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={35} />
        <OrbitControls
          enablePan={false}
          minDistance={5.5}
          maxDistance={80}
          autoRotate={!selectedPerson}
          autoRotateSpeed={0.15}
          makeDefault
        />

        <Stars radius={300} depth={60} count={2000} factor={4} saturation={0} fade speed={0.2} />

        <FocusController selectedPerson={selectedPerson} radius={RADIUS} />

        <Suspense fallback={null}>
          <group>
            <mesh
              material={shaderMaterial}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPerson(null);
              }}
            >
              <sphereGeometry args={[RADIUS, 64, 64]} />
            </mesh>

            <mesh scale={1.002}>
              <sphereGeometry args={[RADIUS, 64, 64]} />
              <meshBasicMaterial color={planetConfig.atmosphereColor} transparent opacity={0.03} />
            </mesh>

            <Seas seas={planetConfig.seas} radius={RADIUS} />
            <PlanetSurface features={mapData.features} radius={RADIUS} />

            {planetConfig.clouds && planetConfig.clouds.opacity > 0 && (
              <Clouds
                radius={RADIUS}
                speed={planetConfig.clouds.rotationSpeed}
                opacity={planetConfig.clouds.opacity}
                color={planetConfig.clouds.color}
              />
            )}

            <PeopleMarkers
              people={people}
              radius={RADIUS}
              selectedPersonId={selectedPerson?.id || null}
              onSelect={onSelectPerson}
            />

            <Transactions transactions={transactions} people={people} radius={RADIUS} />
          </group>
        </Suspense>

        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={2.5} />
      </Canvas>
    </div>
  );
};

export default Globe;
