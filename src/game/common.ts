export const degToRad = (degrees: number) => (degrees * Math.PI) / 180;
export const radToDeg = (radians: number) => (radians * 180) / Math.PI;
export const lerp = (start: number, end: number, amount: number) => {
  return (1 - amount) * start + amount * end;
};
