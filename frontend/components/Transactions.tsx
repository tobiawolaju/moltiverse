
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Person, Transaction } from '../types';
import { latLngToVector3 } from '../services/geoUtils';

const ArcShader = {
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color("#00ffff") }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      // Create a moving pulse/trail along the path (u direction)
      float dash = mod(vUv.x * 2.0 - time * 2.5, 1.0);
      float trail = smoothstep(0.0, 0.5, dash) * smoothstep(1.0, 0.5, dash);
      
      // Glow effect: stronger in the middle of the tube cross-section (v direction)
      float glow = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 3.0);
      
      // White core with cyan glow
      vec3 finalColor = mix(vec3(1.0), color, 0.6);
      float alpha = trail * glow * 0.8;
      
      if (alpha < 0.1) discard;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

interface TransactionArcProps {
  from: Person;
  to: Person;
  radius: number;
}

const TransactionArc: React.FC<TransactionArcProps> = ({ from, to, radius }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const fromExtrusion = (from.height || 0) * 0.6;
    const toExtrusion = (to.height || 0) * 0.6;

    const start = latLngToVector3(from.location[0], from.location[1], radius + 0.1);
    const end = latLngToVector3(to.location[0], to.location[1], radius + 0.1);

    // Calculate mid point and pull it outward to create an arch
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    const midLen = mid.length();
    // Arch height relative to distance between points
    mid.normalize().multiplyScalar(midLen + distance * 0.4);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
  }, [from, to, radius]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        args={[ArcShader]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

interface TransactionsProps {
  transactions: Transaction[];
  people: Person[];
  radius: number;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, people, radius }) => {
  return (
    <group>
      {transactions.map((tx) => {
        const fromPerson = people.find(p => p.id === tx.fromId);
        const toPerson = people.find(p => p.id === tx.toId);
        if (!fromPerson || !toPerson) return null;

        return (
          <TransactionArc
            key={tx.id}
            from={fromPerson}
            to={toPerson}
            radius={radius}
          />
        );
      })}
    </group>
  );
};

export default Transactions;
