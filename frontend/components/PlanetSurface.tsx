
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Feature } from '../types';
import { latLngToVector3 } from '../services/geoUtils';

interface PlanetSurfaceProps {
  features: Feature[];
  radius: number;
}

const LandDitherShader = {
  uniforms: {
    lightPos: { value: new THREE.Vector3(10, 10, 10) }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vColor;
    
    // Note: 'color' attribute is automatically injected by Three.js 
    // when material.vertexColors is true. Manual declaration causes 'redefinition' error.
    
    void main() {
      vColor = color;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 lightPos;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vColor;

    float dither(vec2 uv, float brightness) {
      // Screen-space bayer dithering logic for high-performance GLSL
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
      
      // Apply screen space dithering effect
      float isBright = dither(gl_FragCoord.xy, diff);
      
      // Land masses are dithered between a dark reddish shadow and their vertex color
      vec3 shadowColor = vColor * 0.2;
      vec3 finalColor = mix(shadowColor, vColor, isBright);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

const PlanetSurface: React.FC<PlanetSurfaceProps> = ({ features, radius }) => {
  const { surfaceGeometry, wireGeometry } = useMemo(() => {
    const allVertices: number[] = [];
    const allColors: number[] = [];
    const wireVertices: number[] = [];

    features.forEach((feature) => {
      if (feature.geometry.type !== 'Polygon') return;

      const coords = feature.geometry.coordinates[0];
      const heightFactor = feature.properties.height || 0.1;
      const extrusionRadius = radius + (heightFactor * 0.6); // Increased for clear 3D volume

      const center = [0, 0];
      coords.forEach((p: number[]) => { 
        center[0] += p[0]; 
        center[1] += p[1]; 
      });
      center[0] /= coords.length;
      center[1] /= coords.length;

      const topCenterV = latLngToVector3(center[1], center[0], extrusionRadius);
      
      // Use HSL for consistent reddish-purple variety based on height
      // Hue around 0.85 - 0.95 is reddish purple to magenta
      const baseColor = new THREE.Color().setHSL(0.88 + (heightFactor * 0.1), 0.9, 0.45);

      for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];

        const v1Base = latLngToVector3(p1[1], p1[0], radius);
        const v2Base = latLngToVector3(p2[1], p2[0], radius);
        const v1Top = latLngToVector3(p1[1], p1[0], extrusionRadius);
        const v2Top = latLngToVector3(p2[1], p2[0], extrusionRadius);

        // Solid Mesh (Top Cap)
        allVertices.push(...topCenterV.toArray(), ...v1Top.toArray(), ...v2Top.toArray());
        for(let j=0; j<3; j++) allColors.push(baseColor.r, baseColor.g, baseColor.b);

        // Side Walls (Two triangles per segment)
        allVertices.push(...v1Base.toArray(), ...v2Base.toArray(), ...v1Top.toArray());
        allVertices.push(...v2Base.toArray(), ...v2Top.toArray(), ...v1Top.toArray());
        for(let j=0; j<6; j++) allColors.push(baseColor.r, baseColor.g, baseColor.b);

        // Wireframe lines for technical depth
        wireVertices.push(...v1Top.toArray(), ...v2Top.toArray()); // Top perimeter
        wireVertices.push(...v1Base.toArray(), ...v1Top.toArray()); // Vertical columns
      }
    });

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
    sGeo.setAttribute('color', new THREE.Float32BufferAttribute(allColors, 3));
    sGeo.computeVertexNormals();

    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wireVertices, 3));

    return { surfaceGeometry: sGeo, wireGeometry: wGeo };
  }, [features, radius]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      ...LandDitherShader,
      vertexColors: true,
      transparent: false,
    });
  }, []);

  return (
    <group>
      {/* Solid Dithered Extrusions with reddish-purple colors */}
      <mesh geometry={surfaceGeometry} material={shaderMaterial} />
      
      {/* Glowy Technical Wireframe to define the 3D volume */}
      <lineSegments geometry={wireGeometry}>
        <lineBasicMaterial color="#ff22aa" transparent opacity={0.4} />
      </lineSegments>
    </group>
  );
};

export default PlanetSurface;
