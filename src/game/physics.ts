import { Engine, Body, Bodies, Composite, Events, Vector, World } from "matter-js";
import { FRAME_CACHE_SIZE, DELTA, PREVIEW_FRAME_COUNT } from "./config";

export type BlockTypes = "marble" | "track-block" | "note-block";
export type SerializedBody = {
  canvasId: string;
  physicsId?: number;
  type?: BlockTypes;
  x: number;
  y: number;
  rotation: number;
  radius?: number;
  width?: number;
  height?: number;
  gradientStart?: string | number;
  gradientEnd?: string | number;
  frontColor?: string;
  backColor?: string;
  isStatic?: boolean;
};
export type Frame = {
  id: number;
  bodies: SerializedBody[];
  calcDuration: number;
  timeSpentRendering: number;
  lastFrame: boolean;
};
export type WorkerAction =
  | "initialize"
  | "preview"
  | "disable preview"
  | "enable preview"
  | "clear preview"
  | "update"
  | "destroy";
type PhysicsMessageData = {
  action: WorkerAction;
  bodies?: SerializedBody[];
};
type PhysicsMessageEvent = Omit<MessageEvent, "data"> & { data: PhysicsMessageData };

let frameId = 0;
let noPreview = false;
let previewing = false;
let lastPreviewTime = -10000;
let hasMovingBodies = true;
const engine = Engine.create({
  gravity: {
    scale: 0.01,
  },
});
const world = engine.world;
const frames: Frame[] = [];
let initialState: SerializedBody[] = [];
const physicsToCanvasMap = new Map<number, string>();
const bodiesMap = new Map<string, Body>();

const centerPositionFromTopLeft = (rectangle: SerializedBody) => {
  const topCenterPosition = {
    x: rectangle.x + ((rectangle.width || 0) / 2) * Math.cos(rectangle.rotation),
    y: rectangle.y + ((rectangle.width || 0) / 2) * Math.sin(rectangle.rotation),
  };
  const slope = {
    x: topCenterPosition.x - rectangle.x,
    y: topCenterPosition.y - rectangle.y,
  };
  const distance = Math.sqrt(slope.x ** 2 + slope.y ** 2);
  const unit = {
    x: slope.x / distance,
    y: slope.y / distance,
  };
  const rotated = {
    x: -unit.y,
    y: unit.x,
  };
  return {
    x: topCenterPosition.x + ((rectangle.height || 0) / 2) * rotated.x,
    y: topCenterPosition.y + ((rectangle.height || 0) / 2) * rotated.y,
  };
};

const topLeftPositionFromCenter = (body: Body) => {
  return body.vertices[0];
};

const getSerializedBody = (body: Body) => {
  let x = body.position.x;
  let y = body.position.y;
  if (body.label.includes("block")) {
    const topLeftPosition = topLeftPositionFromCenter(body);
    x = topLeftPosition.x;
    y = topLeftPosition.y;
  }

  const serializedBody: SerializedBody = {
    canvasId: physicsToCanvasMap.get(body.id) || "not found",
    physicsId: body.id,
    x,
    y,
    rotation: body.angle,
  };

  return serializedBody;
};

const getNextFrame = (preview = false): Frame => {
  const startTime = performance.now();
  Engine.update(engine, DELTA);

  return {
    id: frameId,
    bodies: world.bodies.map((body) => getSerializedBody(body)),
    timeSpentRendering: 0,
    calcDuration: performance.now() - startTime,
    lastFrame: preview || !hasMovingBodies,
  };
};

const renderPreview = async () => {
  previewing = true;
  postMessage({
    action: "clear preview",
  });
  const previewFrames: Frame[] = [];
  for (let i = 0; i < PREVIEW_FRAME_COUNT; i += FRAME_CACHE_SIZE) {
    for (let j = 0; j < FRAME_CACHE_SIZE; j++) {
      const frame = getNextFrame(true);
      if (j === 0) previewFrames.push(frame);
    }
  }
  postMessage({ action: "preview", frames: previewFrames });
  previewing = false;
};

const update = (lastFramePassed = false) => {
  if (lastFramePassed) {
    for (let i = frames.length; i > 0; i--) {
      frames.pop();
    }
    return;
  }
  for (let i = 0; i < frames.length; i++) {
    frames[i] = getNextFrame();
    if (frames[i].lastFrame) {
      frames.splice(i + 1);
      return;
    }
  }
  for (let i = frames.length; i < FRAME_CACHE_SIZE; i++) {
    frames.push(getNextFrame());
  }
};

const createAndAddCircle = (circle: SerializedBody) => {
  const circleBody = Bodies.circle(circle.x, circle.y, circle.radius || 20, {
    angle: circle.rotation ? circle.rotation : 0,
    isStatic: circle.isStatic ? true : false,
    restitution: 0.3,
    frictionAir: 0.01,
    friction: 0.05,
    frictionStatic: 0.01,
    label: "marble",
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

  const isTrack = rectangle.type?.includes("track");
  const centerPosition = centerPositionFromTopLeft(rectangle);
  const rectangleBody = Bodies.rectangle(centerPosition.x, centerPosition.y, rectangle.width, rectangle.height, {
    isStatic: rectangle.isStatic ? true : false,
    angle: rectangle.rotation,
    restitution: isTrack ? 0 : 1,
    friction: isTrack ? 0.6 : 0,
    label: isTrack ? "track-block" : "note-block",
  });

  Composite.add(world, rectangleBody);
  physicsToCanvasMap.set(rectangleBody.id, rectangle.canvasId);
  bodiesMap.set(rectangle.canvasId, rectangleBody);

  return getSerializedBody(rectangleBody);
};

const createAndAddLowerBoundary = () => {
  const boundary = Bodies.rectangle(0, 2000, 10000, 100, {
    isStatic: true,
    label: "boundary",
  });
  Composite.add(world, boundary);
};

const initializeBody = (body: SerializedBody) => {
  const physicsBody = bodiesMap.get(body.canvasId);
  if (physicsBody) {
    Composite.remove(world, physicsBody);
    bodiesMap.delete(body.canvasId);
  }
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
};

const removeBody = (physicsId: number) => {
  const canvasId = physicsToCanvasMap.get(physicsId);
  if (!canvasId) return;

  const physicsBody = bodiesMap.get(canvasId);
  if (!physicsBody) throw new TypeError(`There is no body mapped with an id ${canvasId}.`);

  Composite.remove(world, physicsBody);
  physicsToCanvasMap.delete(physicsId);
  bodiesMap.delete(canvasId);
  hasMovingBodies = !!world.bodies.find((body) => !body.isStatic);
};

const initialize = async (bodies: SerializedBody[]) => {
  const initialized: SerializedBody[] = [];
  const canvasIds = bodies.map((body) => body.canvasId);

  World.clear(world, false);
  bodiesMap.clear();
  physicsToCanvasMap.clear();

  createAndAddLowerBoundary();
  for (let i = 0; i < bodies.length; i++) {
    const serializedBody = initializeBody(bodies[i]);
    serializedBody && initialized.push(serializedBody);
  }

  hasMovingBodies = !!world.bodies.find((body) => !body.isStatic);
  initialState = initialized;
  postMessage({
    action: "initialize",
    bodies: initialState,
  });
  if (performance.now() - lastPreviewTime > 100 && !previewing && !noPreview) {
    lastPreviewTime = performance.now();
    await renderPreview();
  }
};

Events.on(engine, "collisionStart", (event) => {
  const { pairs } = event;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (pair.bodyA.label === "boundary") {
      removeBody(pair.bodyB.id);
    }
  }
});

Events.on(engine, "collisionEnd", (event) => {
  const { pairs } = event;
  const alreadyCalculated: Body[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];

    if (
      (pair.bodyA.label === "marble" && pair.bodyB.label === "note-block") ||
      (pair.bodyA.label === "note-block" && pair.bodyB.label === "marble")
    ) {
      const marble = pair.bodyA.label === "marble" ? pair.bodyA : pair.bodyB;
      const block = pair.bodyA.label === "marble" ? pair.bodyB : pair.bodyA;
      if (alreadyCalculated.includes(block)) continue;

      const collisionNormal = pair.collision.normal;
      const bounceFactor = 1 * Vector.magnitude(marble.velocity);
      const addVelocity = Vector.mult(collisionNormal, bounceFactor);
      const newVelocity = Vector.add(marble.velocity, addVelocity);
      Body.setVelocity(marble, newVelocity);
      alreadyCalculated.push(block);
    }
  }
});

addEventListener("message", async (event: PhysicsMessageEvent) => {
  const { data } = event;

  if (data.action === "initialize") {
    if (!data.bodies) {
      throw new TypeError("A message was received to initialize the physics engine, but no bodies were passed.");
    }

    initialize(data.bodies);
  }

  if (data.action === "disable preview") {
    if (!data.bodies) {
      throw new TypeError("A message was received to disable the physics engine preview, but no bodies were passed.");
    }
    noPreview = true;

    initialize(data.bodies);
  }

  if (data.action === "enable preview") {
    if (!data.bodies) {
      throw new TypeError("A message was received to enable the physics engine preview, but no bodies were passed.");
    }
    noPreview = false;

    initialize(data.bodies);
  }

  if (data.action === "update") {
    update(!hasMovingBodies);
    frames.length &&
      postMessage({
        action: "update",
        frames,
      });
  }
});
