import { Engine, Body, Bodies, Composite, Vector } from "matter-js";
import { FRAME_CACHE_SIZE, DELTA } from "./config";

export type SerializedBody = {
  canvasId: string;
  physicsId?: number;
  type?: "marble" | "track-block" | "note-block";
  x: number;
  y: number;
  rotation: number;
  radius?: number;
  width?: number;
  height?: number;
  gradientStart?: string;
  gradientEnd?: string;
  frontColor?: string;
  backColor?: string;
  isStatic?: boolean;
};
export type Frame = { id: number; bodies: SerializedBody[]; calcDuration: number; timeSpentRendering: number };
type WorkerAction = "initialize" | "add bodies" | "update bodies" | "remove bodies" | "update" | "destroy";
type PhysicsMessageData = {
  action: WorkerAction;
  bodies: SerializedBody[];
};
type PhysicsMessageEvent = Omit<MessageEvent, "data"> & { data: PhysicsMessageData };

export const degToRad = (degrees: number) => (degrees * Math.PI) / 180;
export const radToDeg = (radians: number) => (radians * 180) / Math.PI;

let frameId = 0;

const engine = Engine.create({
  gravity: {
    scale: 0.0005,
  },
});
const world = engine.world;
const frames: Frame[] = [];
const physicsToCanvasMap = new Map<number, string>();
const bodiesMap = new Map<string, Body>();

const getSerializedBody = (body: Body) => {
  const serializedBody: SerializedBody = {
    canvasId: physicsToCanvasMap.get(body.id) || "not found",
    physicsId: body.id,
    x: body.position.x,
    y: body.position.y,
    rotation: body.angle,
  };

  return serializedBody;
};

const getNextFrame = (): Frame => {
  const startTime = performance.now();
  Engine.update(engine, DELTA);

  return {
    id: frameId,
    bodies: world.bodies.map((body) => getSerializedBody(body)),
    timeSpentRendering: 0,
    calcDuration: performance.now() - startTime,
  };
};

const update = () => {
  for (let i = 0; i < frames.length; i++) {
    frames[i] = getNextFrame();
  }
  for (let i = frames.length; i < FRAME_CACHE_SIZE; i++) {
    frames.push(getNextFrame());
  }
};

const createAndAddCircle = (circle: SerializedBody) => {
  const circleBody = Bodies.circle(circle.x, circle.y, circle.radius || 20, {
    angle: circle.rotation ? circle.rotation : 0,
    isStatic: circle.isStatic ? true : false,
  });
  Composite.add(world, circleBody);
  physicsToCanvasMap.set(circleBody.id, circle.canvasId);
  bodiesMap.set(circle.canvasId, circleBody);

  return getSerializedBody(circleBody);
};

const createAndAddRectangle = (rectangle: SerializedBody) => {
  if (!rectangle.width || !rectangle.height) {
    throw new TypeError("Please include a width and height when creating a rectangle.");
  }
  const rectangleBody = Bodies.rectangle(
    rectangle.x - rectangle.width / 2,
    rectangle.y - rectangle.height / 2,
    rectangle.width,
    rectangle.height,
    {
      angle: rectangle.rotation ? rectangle.rotation : 0,
      isStatic: rectangle.isStatic ? true : false,
    },
  );
  Composite.add(world, rectangleBody);
  physicsToCanvasMap.set(rectangleBody.id, rectangle.canvasId);
  bodiesMap.set(rectangle.canvasId, rectangleBody);

  return getSerializedBody(rectangleBody);
};

const initializeBody = (body: SerializedBody) => {
  const physicsBody = bodiesMap.get(body.canvasId);
  if (!physicsBody) {
    switch (body.type) {
      case "marble":
        return createAndAddCircle(body);
      case "track-block":
        return createAndAddRectangle(body);
      case "note-block":
        return createAndAddRectangle(body);
      default:
        return;
    }
  }

  physicsBody.position.x = body.x;
  physicsBody.position.y = body.y;
  physicsBody.angle = body.rotation;
  if (body.radius) physicsBody.circleRadius = body.radius;
  if (body.width && body.height) {
    physicsBody.vertices = [
      { x: body.x, y: body.y },
      { x: body.x, y: body.y + body.height },
      { x: body.x + body.width, y: body.y + body.height },
      { x: body.x + body.width, y: body.y },
    ];
  }

  return getSerializedBody(physicsBody);
};

const removeBody = (physicsId: number) => {
  const canvasId = physicsToCanvasMap.get(physicsId);
  if (!canvasId) throw new TypeError(`There is no body in the canvas mapped with a physics ID ${physicsId}.`);

  const physicsBody = bodiesMap.get(canvasId);
  if (!physicsBody) throw new TypeError(`There is no body mapped with an id ${canvasId}.`);

  Composite.remove(world, physicsBody);
  physicsToCanvasMap.delete(physicsId);
  bodiesMap.delete(canvasId);
};
