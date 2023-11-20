import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { RectConfig } from "konva/lib/shapes/Rect";
import { GetSet } from "konva/lib/types";
import { Frame, SerializedBody, WorkerAction } from "./physics";
import { radToDeg, degToRad } from "./common";
import { FRAME_CACHE_SIZE, PREVIEW_FRAME_COUNT } from "./config";

type Body = Marble | TrackBlock | NoteBlock;
type CanvasMessageData = {
  action: WorkerAction;
  bodies?: SerializedBody[];
  frames?: Frame[];
};
type CanvasMessageEvent = Omit<MessageEvent, "data"> & { data: CanvasMessageData };

class Marble extends Konva.Circle {
  workspace: WorkspaceEditor;
  physicsId?: number;
  initialState: SerializedBody;

  constructor(
    workspace: WorkspaceEditor,
    x: number,
    y: number,
    rotation: number,
    radius: number,
    gradientStart: string | number,
    gradientEnd: string | number,
    otherOptions: CircleConfig = {},
  ) {
    super({
      x,
      y,
      rotation: radToDeg(rotation),
      radius,
      fillRadialGradientStartPoint: {
        x: -radius / 2,
        y: -radius / 2,
      },
      fillRadialGradientColorStops: [0, gradientStart, 1, gradientEnd],
      fillRadialGradientStartRadius: radius / 4,
      fillRadialGradientEndRadius: radius * 1.5,
      fillPriority: "radial-gradient",
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffset: {
        x: 3,
        y: 6,
      },
      draggable: true,
      dragDistance: 4,
      name: "marble",
      ...otherOptions,
    });
    this.id(`${this._id}`);
    this.workspace = workspace;
    this.workspace.addBody(this);
    this.initialState = this.serialize();

    this.on("dragend", () => {
      this.initialState = this.serialize();
      this.workspace.initialize();
    });
    this.on("transform", () => {
      this.skewX(0);
      this.skewY(0);
      if (Math.round(this.scaleX() * 1000) !== 1000) {
        this.radius(this.radius() * this.scaleX());
        this.scaleX(1);
      } else if (Math.round(this.scaleY() * 1000) !== 1000) {
        this.radius(this.radius() * this.scaleY());
        this.scaleY(1);
      }
      this.fillRadialGradientStartPoint({
        x: -this.radius() / 2,
        y: -this.radius() / 2,
      });
      this.fillRadialGradientStartRadius(this.radius() / 4);
      this.fillRadialGradientEndRadius(this.radius() * 1.5);
      this.initialState = this.serialize();
      this.workspace.initialize();
    });
  }

  serialize(): SerializedBody {
    return {
      canvasId: this.id(),
      type: "marble",
      x: this.x(),
      y: this.y(),
      rotation: degToRad(this.rotation()),
      radius: this.radius(),
      gradientStart: this.fillRadialGradientColorStops()[1],
      gradientEnd: this.fillRadialGradientColorStops()[3],
      isStatic: false,
    };
  }

  cleanup() {
    this.remove();
  }
}

class TrackBlock extends Konva.Rect {
  static xOffset = 5;
  static yOffset = -5;
  workspace: WorkspaceEditor;
  backTrack: Konva.Rect;
  physicsId?: number;
  initialState: SerializedBody;

  constructor(
    workspace: WorkspaceEditor,
    x: number,
    y: number,
    rotation: number,
    width: number,
    height: number,
    frontColor: string,
    backColor: string,
    otherOptions: RectConfig = {},
  ) {
    super({
      x,
      y,
      rotation: radToDeg(rotation),
      width,
      height,
      fill: frontColor,
      cornerRadius: Math.min(width, height) / 2,
      shadowColor: "black",
      shadowOpacity: 0.75,
      shadowBlur: 10,
      shadowOffset: {
        x: 3,
        y: 6,
      },
      draggable: true,
      dragDistance: 4,
      name: "track-block",
      ...otherOptions,
    });
    this.backTrack = new Konva.Rect({
      x: x + TrackBlock.xOffset,
      y: y + TrackBlock.yOffset,
      rotation: radToDeg(rotation),
      width,
      height,
      fill: backColor,
      cornerRadius: Math.min(width, height) / 2,
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffset: {
        x: 3,
        y: 6,
      },
      name: "backtrack-block",
    });
    this.id(`${this._id}`);
    this.workspace = workspace;
    this.workspace.backgroundLayer.add(this.backTrack);
    this.workspace.addBody(this);
    this.initialState = this.serialize();

    this.on("dragend", () => {
      this.initialState = this.serialize();
      this.workspace.initialize();
    });
    this.on("transform", () => {
      this.backTrack.x(this.x() + TrackBlock.xOffset * this.scaleX());
      this.backTrack.y(this.y() + TrackBlock.yOffset * this.scaleY());
      this.backTrack.rotation(this.rotation());
      this.width(this.width() * this.scaleX());
      this.scaleX(1);
      this.height(this.height() * this.scaleY());
      this.scaleY(1);
      this.cornerRadius(Math.min(this.width(), this.height()) / 2);
      this.skewX(0);
      this.skewY(0);
      this.backTrack.width(this.width());
      this.backTrack.height(this.height());
      this.backTrack.cornerRadius(this.cornerRadius());
      this.initialState = this.serialize();
      this.workspace.initialize();
    });
    this.x = ((newX?: number) => {
      newX && super.x(newX);
      this.backTrack.x(super.x() + TrackBlock.xOffset * this.scaleX());
      return super.x();
    }) as GetSet<number, this>;
    this.y = ((newY?: number) => {
      newY && super.y(newY);
      this.backTrack.y(super.y() + TrackBlock.yOffset * this.scaleY());
      return super.y();
    }) as GetSet<number, this>;
  }

  serialize(): SerializedBody {
    return {
      canvasId: this.id(),
      type: "track-block",
      x: this.x(),
      y: this.y(),
      width: this.width(),
      height: this.height(),
      rotation: degToRad(this.rotation()),
      frontColor: this.fill(),
      backColor: this.backTrack.fill(),
      isStatic: true,
    };
  }

  cleanup() {
    this.remove();
    this.backTrack.remove();
  }
}

class NoteBlock extends Konva.Rect {
  static xOffset = 3;
  static yOffset = 6;
  workspace: WorkspaceEditor;
  physicsId?: number;
  initialState: SerializedBody;

  constructor(
    workspace: WorkspaceEditor,
    x: number,
    y: number,
    rotation: number,
    width: number,
    height: number,
    gradientStart: string | number,
    gradientEnd: string | number,
    otherOptions: RectConfig = {},
  ) {
    super({
      x,
      y,
      rotation: radToDeg(rotation),
      width,
      height,
      fillLinearGradientColorStops: [0, gradientStart, 1, gradientEnd],
      fillLinearGradientStartPoint: {
        x: width / 2,
        y: 0,
      },
      fillLinearGradientEndPoint: {
        x: width / 2,
        y: height / 2,
      },
      fillPriority: "linear-gradient",
      cornerRadius: 5,
      shadowColor: "black",
      shadowBlur: 10,
      shadowOffset: {
        x: 3,
        y: 6,
      },
      draggable: true,
      dragDistance: 4,
      name: "note-block",
      ...otherOptions,
    });
    this.id(`${this._id}`);
    this.workspace = workspace;
    this.workspace.addBody(this);
    this.initialState = this.serialize();

    this.on("dragend", () => {
      this.initialState = this.serialize();
      this.workspace.initialize();
    });
    this.on("transform", () => {
      this.width(this.width() * this.scaleX());
      this.scaleX(1);
      this.height(this.height() * this.scaleY());
      this.scaleY(1);
      this.skewX(0);
      this.skewY(0);
      this.fillLinearGradientStartPoint({
        x: this.width() / 2,
        y: 0,
      });
      this.fillLinearGradientEndPoint({
        x: this.width() / 2,
        y: this.height() / 2,
      });
      this.initialState = this.serialize();
      this.workspace.initialize();
    });
  }

  serialize(): SerializedBody {
    return {
      canvasId: this.id(),
      type: "note-block",
      x: this.x(),
      y: this.y(),
      width: this.width(),
      height: this.height(),
      rotation: degToRad(this.rotation()),
      gradientStart: this.fillLinearGradientColorStops()[1],
      gradientEnd: this.fillLinearGradientColorStops()[3],
      isStatic: true,
    };
  }

  cleanup() {
    this.remove();
  }
}

export class WorkspaceEditor {
  container: HTMLDivElement;
  initialState: (SerializedBody | Omit<SerializedBody, "canvasId">)[];
  unrenderedFrames: Frame[];
  renderedFrames: Frame[];
  previewFrames: Frame[];
  stage: Konva.Stage;
  stageOffset: { offsetX: number; offsetY: number };
  backgroundLayer: Konva.Layer;
  interactLayer: Konva.Layer;
  transformer: Konva.Transformer;
  selection: Konva.Rect;
  previewLines: Map<string, Konva.Line>;
  selectionVertices: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };
  bodies: Body[];
  physics: Worker;
  physicsBusy: boolean;
  playing: boolean;

  constructor(container: HTMLDivElement, initialState: Omit<SerializedBody, "canvasId">[] = []) {
    this.container = container;
    this.physics = new Worker("./src/game/physics.ts", { type: "module" });
    this.physicsBusy = false;
    this.bodies = [];
    this.unrenderedFrames = [];
    this.renderedFrames = [];
    this.previewFrames = [];
    this.stage = new Konva.Stage({
      container: this.container,
      draggable: true,
    });
    this.stageOffset = {
      offsetX: 0,
      offsetY: 0,
    };
    this.sizeToContainer();
    this.playing = false;

    this.backgroundLayer = new Konva.Layer({
      listening: false,
    });
    this.interactLayer = new Konva.Layer();
    this.transformer = new Konva.Transformer({
      enabledAnchors: ["middle-left", "middle-right", "top-center", "bottom-center"],
      flipEnabled: false,
      centeredScaling: true,
    });
    this.selection = new Konva.Rect({
      fill: "rgba(0, 0, 200, 0.5)",
      visible: false,
    });
    this.previewLines = new Map();
    this.selectionVertices = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
    };
    this.stage.add(this.backgroundLayer);
    this.stage.add(this.interactLayer);
    this.interactLayer.add(this.transformer);
    this.interactLayer.add(this.selection);
    this.listenForPointerEvents();

    this.initialState = initialState;
    this.initialize(initialState);

    this.physics.addEventListener("message", (event) => this.handlePhysicsResponse(this, event));
  }

  sizeToContainer() {
    const bounds = this.container.getBoundingClientRect();
    this.stage.setSize({
      width: bounds.width,
      height: bounds.height,
    });
  }

  selectionStart(event: KonvaEventObject<MouseEvent>) {
    const pointerPosition = this.stage.getRelativePointerPosition();
    if (!pointerPosition) return;
    event.evt.preventDefault();
    this.stage.draggable(false);
    this.selectionVertices = {
      x1: pointerPosition.x,
      x2: pointerPosition.x,
      y1: pointerPosition.y,
      y2: pointerPosition.y,
    };
    this.selection.width(0);
    this.selection.height(0);
    this.selection.visible(true);
  }

  selectionDrag(event: KonvaEventObject<MouseEvent>) {
    const pointerPosition = this.stage.getRelativePointerPosition();
    if (!pointerPosition) return;

    event.evt.preventDefault();
    this.selectionVertices.x2 = pointerPosition.x;
    this.selectionVertices.y2 = pointerPosition.y;

    const { x1, x2, y1, y2 } = this.selectionVertices;
    this.selection.setAttrs({
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    });
  }

  selectionEnd(event: KonvaEventObject<any>) {
    event.evt.preventDefault();
    this.selection.visible(false);
    if (this.selection.width() < 5 || this.selection.height() < 5) {
      return;
    }

    const box = this.selection.getClientRect();
    const selected = this.bodies.filter((body) => Konva.Util.haveIntersection(box, body.getClientRect()));
    this.transformer.nodes(selected);
  }

  selectionTap(event: KonvaEventObject<MouseEvent>) {
    if (
      !this.bodies.includes(event.target as Body) ||
      this.transformer.nodes().includes(event.target) ||
      event.target === this.stage
    ) {
      return;
    }
    const metaPressed = event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey;
    const isSelected = this.transformer.nodes().includes(event.target);

    if (!metaPressed && !isSelected && !this.transformer.nodes().includes(event.target)) {
      this.transformer.nodes([event.target]);
    } else if (metaPressed && isSelected) {
      this.transformer.nodes(this.transformer.nodes().filter((node) => node !== event.target));
    } else if (metaPressed && !isSelected && !this.transformer.nodes().includes(event.target)) {
      this.transformer.nodes([...this.transformer.nodes(), event.target]);
    }
  }

  recenter() {
    this.stage.position({ x: 0, y: 0 });
  }

  listenForPointerEvents() {
    this.stage.on("mousedown", (event) => {
      if (event.target !== this.stage) return this.stage.draggable(false);
      if (event.evt.button !== 0) return;
      if (this.playing) return this.transformer.nodes([]);

      this.selectionStart(event);
    });

    this.stage.on("mousemove", (event) => {
      if (!this.selection.visible()) return;
      if (this.playing) return this.transformer.nodes([]);
      this.selectionDrag(event);
    });

    this.stage.on("mouseup", (event) => {
      this.stage.draggable(true);
      if (!this.selection.visible()) return;
      if (this.playing) return this.transformer.nodes([]);

      this.selectionEnd(event);
    });

    this.stage.on("click tap", (event) => {
      if (this.playing) return this.transformer.nodes([]);
      if (this.selection.visible()) {
        this.transformer.nodes([]);
      }
      if (event.target === this.stage || event.target.parent !== this.interactLayer) {
        return this.transformer.nodes([]);
      }

      this.selectionTap(event);
    });

    this.stage.on("dblclick dbltap", (event) => {
      if (event.target !== this.stage) return;
      this.recenter();
    });
  }

  organizeInteractLayer() {
    this.transformer.moveToTop();
    this.selection.moveToTop();
  }

  addBody(body: Body) {
    this.bodies.push(body);
    this.interactLayer.add(body);
    this.organizeInteractLayer();
  }

  addBodies(bodies: Body[]) {
    bodies.forEach((body) => this.addBody(body));
  }

  addPreviewLine(canvasId: string, points: number[]) {
    const previewLine = new Konva.Line({
      points,
      stroke: "gray",
      strokeWidth: 1,
    });
    this.backgroundLayer.add(previewLine);
    this.previewLines.set(canvasId, previewLine);
  }

  removePreviewLine(canvasId: string) {
    this.previewLines.get(canvasId)?.remove();
    this.previewLines.delete(canvasId);
  }

  getPreviewPointsFromMarble(marble: Marble) {
    const points: number[] = [];
    for (let i = 0; i < this.previewFrames.length; i += 10) {
      const frame = this.previewFrames[i];
      const serializedMarble = frame.bodies.find((body) => body.canvasId === marble.id());
      if (!serializedMarble) return points;
      points.push(serializedMarble.x, serializedMarble.y);
    }

    return points;
  }

  getMarbles(): Marble[] {
    return this.bodies.filter((body) => body.name() === "marble") as Marble[];
  }

  updatePreviewLines() {
    const marbles = this.getMarbles();
    for (let i = 0; i < marbles.length; i++) {
      const marble = marbles[i];
      const points = this.getPreviewPointsFromMarble(marble);

      const previewLine = this.previewLines.get(marble.id());
      if (previewLine) {
        previewLine.remove();
      }
      this.addPreviewLine(marble.id(), points);
    }
  }

  cleanup() {
    const marbles = this.getMarbles();

    for (let i = marbles.length - 1; i >= 0; i--) {
      const marble = marbles[i];
      const previewLine = this.previewLines.get(marble.id());
      if (previewLine) {
        previewLine.remove();
        this.previewLines.delete(marble.id());
      }
    }

    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const body = this.bodies[i];
      body.cleanup();
      this.bodies.pop();
    }
  }

  initialize(bodies?: Omit<SerializedBody, "canvasId">[]) {
    if (bodies) {
      if (this.bodies.length) {
        this.cleanup();
      }

      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        switch (body.type) {
          case "marble":
            if (body.radius && body.gradientStart && body.gradientEnd)
              new Marble(this, body.x, body.y, body.rotation, body.radius, body.gradientStart, body.gradientEnd);
            break;
          case "track-block":
            if (body.width && body.height && body.frontColor && body.backColor)
              new TrackBlock(
                this,
                body.x,
                body.y,
                body.rotation,
                body.width,
                body.height,
                body.frontColor,
                body.backColor,
              );
            break;
          case "note-block":
            if (body.width && body.height && body.gradientStart && body.gradientEnd)
              new NoteBlock(
                this,
                body.x,
                body.y,
                body.rotation,
                body.width,
                body.height,
                body.gradientStart,
                body.gradientEnd,
              );
            break;
        }
      }
    }
    this.initialState = this.bodies.map((body) => body.initialState);
    this.unrenderedFrames = [];
    this.renderedFrames = [];
    this.previewFrames = [];
    if (!this.physicsBusy) {
      this.physics.postMessage({
        action: "initialize",
        bodies: this.initialState,
      });
      this.physicsBusy = true;
    }
  }

  update(delta: number) {}

  draw(self: WorkspaceEditor, delta: number) {
    console.log("draw");
    if (!self.playing) return;
  }

  play(self: WorkspaceEditor) {
    console.log("play");
    self.playing = true;
    requestAnimationFrame((delta) => self.draw(self, delta));
  }

  pause(self: WorkspaceEditor) {
    console.log("pause");
    this.playing = false;
  }

  stop(self: WorkspaceEditor) {
    console.log("stop");
    this.playing = false;
    this.initialize(this.initialState);
  }

  handlePhysicsResponse(self: WorkspaceEditor, event: CanvasMessageEvent) {
    if (event.data.action === "initialize") {
      this.physicsBusy = false;
    }
    if (event.data.action === "preview") {
      self.previewFrames = [];
      event.data.frames && self.previewFrames.push(...event.data.frames);
      self.updatePreviewLines();
    }
  }
}
