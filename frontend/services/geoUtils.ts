
import { Vector3 } from 'three';

/**
 * Converts latitude and longitude to a 3D Vector3 position on a sphere.
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @param radius Radius of the sphere
 * @returns Vector3 position
 */
export const latLngToVector3 = (lat: number, lng: number, radius: number): Vector3 => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new Vector3(x, y, z);
};

/**
 * Normalizes a value between a min and max.
 */
export const normalize = (val: number, max: number, min: number) => {
  return (val - min) / (max - min);
};
