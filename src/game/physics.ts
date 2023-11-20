import { Engine, Body, Bodies, Composite, Events, Vector } from "matter-js";
import { FRAME_CACHE_SIZE, DELTA, PREVIEW_FRAME_COUNT } from "./config";
import Konva from "konva";

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
  gradientStart?: string | number;
  gradientEnd?: string | number;
  frontColor?: string;
  backColor?: string;
  isStatic?: boolean;
};
export type Frame = { id: number; bodies: SerializedBody[]; calcDuration: number; timeSpentRendering: number };
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
const engine = Engine.create({
  // TODO - configure engine to figure out why collisions look kind of funny
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

const renderPreview = async () => {
  previewing = true;
  postMessage({
    action: "clear preview",
  });
  const previewFrames: Frame[] = [];
  for (let i = 0; i < PREVIEW_FRAME_COUNT; i += FRAME_CACHE_SIZE) {
    for (let j = 0; j < FRAME_CACHE_SIZE; j++) {
      const frame = getNextFrame();
      if (j === 0) previewFrames.push(frame);
    }
  }
  postMessage({ action: "preview", frames: previewFrames });
  previewing = false;
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
    restitution: 0.4,
    frictionAir: 0.01,
    friction: 0.01,
    frictionStatic: 0.25,
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
    restitution: isTrack ? 0.001 : 1,
    friction: isTrack ? 0.1 : 0.01,
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
  if (!canvasId) throw new TypeError(`There is no body in the canvas mapped with a physics ID ${physicsId}.`);

  const physicsBody = bodiesMap.get(canvasId);
  if (!physicsBody) throw new TypeError(`There is no body mapped with an id ${canvasId}.`);

  Composite.remove(world, physicsBody);
  physicsToCanvasMap.delete(physicsId);
  bodiesMap.delete(canvasId);
};

const initialize = async (bodies: SerializedBody[]) => {
  const initialized: SerializedBody[] = [];
  const canvasIds = bodies.map((body) => body.canvasId);
  // createAndAddLowerBoundary(); // TODO: Figure out lower boundary and make it work

  for (let i = 0; i < world.bodies.length; i++) {
    const body = world.bodies[i];
    const canvasId = physicsToCanvasMap.get(body.id);
    if (!canvasId) {
      Composite.remove(world, body);
      continue;
    }
    if (!canvasIds.includes(canvasId)) {
      removeBody(body.id);
    }
  }

  for (let i = 0; i < bodies.length; i++) {
    const serializedBody = initializeBody(bodies[i]);
    serializedBody && initialized.push(serializedBody);
  }

  initialState = initialized;
  console.log(initialState);
  postMessage({
    action: "initialize",
    bodies: initialState,
  });
  if (performance.now() - lastPreviewTime > 100 && !previewing && !noPreview) {
    lastPreviewTime = performance.now();
    await renderPreview();
  }
};

Events.on(engine, "collisionEnd", (event) => {
  const { pairs } = event;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (
      (pair.bodyA.label === "marble" && pair.bodyB.label === "note-block") ||
      (pair.bodyA.label === "note-block" && pair.bodyB.label === "mable")
    ) {
      const marble = pair.bodyA.label === "marble" ? pair.bodyA : pair.bodyB;
      const extraVelocity = Vector.create(0, -5);
      Body.setVelocity(marble, Vector.add(marble.velocity, extraVelocity));
    } else if (pair.bodyA.label === "boundary") {
      removeBody(pair.bodyB.id);
    } else if (pair.bodyB.label === "boundary") {
      removeBody(pair.bodyA.id);
    }
  }
});

addEventListener("message", async (event: PhysicsMessageEvent) => {
  const { data } = event;

  if (data.action === "initialize") {
    console.log("[physics] initialize");
    if (!data.bodies) {
      throw new TypeError("A message was received to initialize the physics engine, but no bodies were passed.");
    }

    initialize(data.bodies);
  }

  if (data.action === "disable preview") {
    console.log("[physics] disble preview");
    if (!data.bodies) {
      throw new TypeError("A message was received to disable the physics engine preview, but no bodies were passed.");
    }
    noPreview = true;

    initialize(data.bodies);
  }

  if (data.action === "enable preview") {
    console.log("[physics] enable preview");
    if (!data.bodies) {
      throw new TypeError("A message was received to enable the physics engine preview, but no bodies were passed.");
    }
    noPreview = false;

    initialize(data.bodies);
  }

  if (data.action === "update") {
    console.log("[physics] update");
    update();
    postMessage({
      action: "update",
      frames,
    });
  }
});
