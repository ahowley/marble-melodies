import Konva from "konva";
import PhysicsWorker from "./physics.ts?worker";
import { KonvaEventObject } from "konva/lib/Node";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { RectConfig } from "konva/lib/shapes/Rect";
import { GetSet } from "konva/lib/types";
import { COLORS, DELTA, FRAME_CACHE_SIZE, SCALE_BY } from "./config";
import { GameSettings } from "../components/game_context/GameContext";
import { Frame, SerializedBody, WorkerAction } from "./physics";
import { radToDeg, degToRad, lerp } from "./common";
import { Music, Notes, Octaves } from "./music";

export type Body = Marble | TrackBlock | NoteBlock;
type CanvasMessageData = {
  action: WorkerAction;
  bodies?: SerializedBody[];
  frames?: Frame[];
};
type CanvasMessageEvent = Omit<MessageEvent, "data"> & { data: CanvasMessageData };

export class Marble extends Konva.Circle {
  workspace: WorkspaceEditor;
  physicsId?: number;
  initialState: SerializedBody;
  cameraTracking: boolean;

  constructor(
    workspace: WorkspaceEditor,
    x: number,
    y: number,
    rotation: number,
    radius: number,
    gradientStart: string | number,
    gradientEnd: string | number,
    cameraTracking: boolean,
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
      shadowColor: COLORS.backgroundDark,
      shadowOpacity: 0.5,
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
    this.cameraTracking = cameraTracking;
    if (this.cameraTracking) this.workspace.bodyTrackedByCamera = this;
    this.initialState = this.serialize();

    this.on("dragstart", () => {
      this.workspace.draggingBodies.push(this);
    });
    this.on("dragend", () => {
      this.workspace.draggingBodies = [];
      this.workspace.needsPreviewUpdate = true;
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
      cameraTracking: !!this.cameraTracking,
      isStatic: false,
    };
  }

  setTrackCamera(track: boolean) {
    if (track) {
      const bodies = this.workspace.bodies;
      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        if (body instanceof Marble) {
          body.cameraTracking = false;
          body.initialState = body.serialize();
        }
      }
    }

    this.cameraTracking = track;
    this.workspace.bodyTrackedByCamera = track ? this : null;

    this.initialState = this.serialize();
    this.workspace.initialize();
  }

  cleanup() {
    this.remove();
  }
}

export class TrackBlock extends Konva.Rect {
  static xOffset = 10;
  static yOffset = -10;
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
      shadowColor: COLORS.backgroundDark,
      shadowOpacity: 0.5,
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
      shadowColor: COLORS.backgroundDark,
      shadowOpacity: 0.5,
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

    this.on("dragstart", () => {
      this.workspace.draggingBodies.push(this);
    });
    this.on("dragend", () => {
      this.workspace.draggingBodies = [];
      this.workspace.needsPreviewUpdate = true;
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

export class NoteBlock extends Konva.Rect {
  static xOffset = 3;
  static yOffset = 6;
  workspace: WorkspaceEditor;
  physicsId?: number;
  note: Notes;
  octave: Octaves;
  volume: number;
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
    note: Notes,
    octave: Octaves,
    volume: number,
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
      shadowColor: COLORS.backgroundDark,
      shadowOpacity: 0.5,
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
    this.note = note;
    this.octave = octave;
    this.volume = volume;
    this.workspace = workspace;
    this.workspace.addBody(this);
    this.initialState = this.serialize();

    this.on("dragstart", () => {
      this.workspace.draggingBodies.push(this);
    });
    this.on("dragend", () => {
      this.workspace.draggingBodies = [];
      this.workspace.needsPreviewUpdate = true;
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
      note: this.note,
      octave: this.octave,
      volume: this.volume,
    };
  }

  changeNote(newNote: Notes) {
    this.note = newNote;
    this.initialState = this.serialize();
    this.workspace.initialize();
  }

  changeOctave(newOctave: Octaves) {
    this.octave = newOctave;
    this.initialState = this.serialize();
    this.workspace.initialize();
  }

  changeVolume(newVolume: number) {
    this.volume = newVolume;
    this.initialState = this.serialize();
    this.workspace.initialize();
  }

  cleanup() {
    this.remove();
  }
}

export class WorkspaceEditor {
  container: HTMLDivElement;
  initialState: (SerializedBody | Omit<SerializedBody, "canvasId">)[];
  music: Music | null;
  unrenderedFrames: Frame[];
  renderedFrames: Frame[];
  previewFrames: Frame[];
  stage: Konva.Stage;
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
  lastPinchCenter: null | { x: number; y: number };
  lastPinchDistance: number;
  dragStopped: boolean;
  bodies: Body[];
  bodiesMap: Map<string, Body>;
  draggingBodies: Body[];
  bodyTrackedByCamera: null | Marble;
  physics: Worker;
  physicsBusy: boolean;
  playing: boolean;
  stopCallback?: () => void;
  previousDrawTime: number;
  disableTransformer: boolean;
  needsPreviewUpdate: boolean;
  previewOnPlayback: boolean;

  constructor(
    container: HTMLDivElement,
    settings: GameSettings,
    stopCallback: () => void,
    initialState: Omit<SerializedBody, "canvasId">[] = [],
  ) {
    Konva.dragButtons = [0];
    Konva.hitOnDragEnabled = true;
    this.container = container;
    this.physics = new PhysicsWorker();
    this.physicsBusy = false;
    this.bodies = [];
    this.bodiesMap = new Map();
    this.draggingBodies = [];
    this.bodyTrackedByCamera = null;
    this.unrenderedFrames = [];
    this.renderedFrames = [];
    this.previewFrames = [];
    this.stage = new Konva.Stage({
      container: this.container,
      draggable: true,
    });
    this.sizeToContainer();
    this.playing = false;
    this.stopCallback = stopCallback;
    this.disableTransformer = false;
    this.needsPreviewUpdate = false;
    this.previewOnPlayback = settings.previewOnPlayback;
    this.previousDrawTime = 0;
    this.music = null;

    this.backgroundLayer = new Konva.Layer({
      listening: false,
    });
    this.interactLayer = new Konva.Layer();
    this.transformer = new Konva.Transformer({
      enabledAnchors: ["middle-left", "middle-right", "top-center", "bottom-center"],
      anchorStroke: COLORS.accentLight,
      anchorStrokeWidth: 2,
      anchorFill: COLORS.highlight,
      anchorSize: 15,
      anchorCornerRadius: 5,
      borderStroke: COLORS.accentDark,
      borderStrokeWidth: 2,
      borderDash: [5, 5],
      flipEnabled: false,
    });
    this.selection = new Konva.Rect({
      fill: COLORS.accentSecondaryDark,
      opacity: 0.3,
      cornerRadius: 5,
      visible: false,
    });
    this.lastPinchCenter = null;
    this.lastPinchDistance = 0;
    this.dragStopped = false;
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

  selectionStart(_event: KonvaEventObject<MouseEvent>) {
    const pointerPosition = this.stage.getRelativePointerPosition();
    if (!pointerPosition) return;
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

  selectionDrag(_event: KonvaEventObject<MouseEvent>) {
    const pointerPosition = this.stage.getRelativePointerPosition();
    if (!pointerPosition) return;

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

  selectionEnd(_event: KonvaEventObject<any>) {
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
      ![0, undefined].includes(event.evt.button) ||
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
    if (!(this.playing && this.bodyTrackedByCamera)) {
      this.stage.position({ x: 0, y: 0 });
    }
  }

  scale(scale: { x: number; y: number }, position: { x: number; y: number }) {
    this.stage.scale(scale);
    this.stage.position(position);
  }

  listenForPointerEvents() {
    this.stage.on("mousedown", (event) => {
      if (this.playing || this.disableTransformer) {
        return this.transformer.nodes([]);
      }
      if (event.target !== this.stage) return this.stage.draggable(false);
      if (event.evt.button !== 2) return;

      this.selectionStart(event);
    });

    this.stage.on("mousemove", (event) => {
      if (this.playing || this.disableTransformer) return this.transformer.nodes([]);
      if (!this.selection.visible()) return;
      this.selectionDrag(event);
    });

    this.stage.on("mouseup", (event) => {
      if (!(this.playing && this.bodyTrackedByCamera)) {
        this.stage.draggable(true);
      }
      if (this.playing || this.disableTransformer) return this.transformer.nodes([]);
      if (!this.selection.visible()) return;

      this.selectionEnd(event);
    });

    this.stage.on("click touchend", (event) => {
      this.lastPinchCenter = null;
      this.lastPinchDistance = 0;

      if (this.playing || this.disableTransformer) return this.transformer.nodes([]);
      if (this.selection.visible()) {
        this.transformer.nodes([]);
      }
      if (
        event.target === this.stage ||
        (event.target.parent !== this.interactLayer && event.target.parent !== this.transformer)
      ) {
        return this.transformer.nodes([]);
      }

      this.selectionTap(event);
    });

    this.stage.on("dblclick dbltap", (event) => {
      if (event.target !== this.stage) return;
      this.recenter();
    });

    this.stage.on("wheel", (event) => {
      event.evt.preventDefault();

      const oldScale = this.stage.scaleX();
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - this.stage.x()) / oldScale,
        y: (pointer.y - this.stage.y()) / oldScale,
      };

      const direction = event.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY;
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      this.scale({ x: newScale, y: newScale }, newPos);
    });

    this.stage.on("touchmove", (event) => {
      const touch1 = event.evt.touches[0];
      const touch2 = event.evt.touches[1];

      if (touch1 && !touch2 && !this.stage.isDragging() && this.dragStopped) {
        this.stage.startDrag();
        this.dragStopped = false;
      }

      if (touch1 && touch2) {
        if (this.stage.isDragging()) {
          this.dragStopped = true;
          this.stage.stopDrag();
        }

        const p1 = {
          x: touch1.clientX,
          y: touch1.clientY,
        };
        const p2 = {
          x: touch2.clientX,
          y: touch2.clientY,
        };

        if (!this.lastPinchCenter) {
          this.lastPinchCenter = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
          };
          return;
        }

        const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        if (!this.lastPinchDistance) {
          this.lastPinchDistance = distance;
        }
        const newCenter = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
        const pointTo = {
          x: (newCenter.x - this.stage.x()) / this.stage.scaleX(),
          y: (newCenter.y - this.stage.y()) / this.stage.scaleX(),
        };
        const scale = this.stage.scaleX() * (distance / this.lastPinchDistance);
        const dx = newCenter.x - this.lastPinchCenter.x;
        const dy = newCenter.y - this.lastPinchCenter.y;
        const newPosition = {
          x: newCenter.x - pointTo.x * scale + dx,
          y: newCenter.y - pointTo.y * scale + dy,
        };

        this.scale({ x: scale, y: scale }, newPosition);
        this.lastPinchDistance = distance;
        this.lastPinchCenter = newCenter;
      }
    });

    this.transformer.on("transformend", () => {
      this.needsPreviewUpdate = true;
    });
  }

  organizeInteractLayer() {
    this.transformer.moveToTop();
    this.selection.moveToTop();
  }

  addBody(body: Body) {
    this.bodies.push(body);
    this.bodiesMap.set(body.id(), body);
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
      strokeWidth: 3,
      lineCap: "round",
      lineJoin: "round",
      tension: 0.5,
      perfectDrawEnabled: false,
    });
    this.backgroundLayer.add(previewLine);
    this.previewLines.set(canvasId, previewLine);
  }

  removePreviewLine(canvasId: string) {
    this.previewLines.get(canvasId)?.remove();
    this.previewLines.delete(canvasId);
  }

  removePreviewLines() {
    const marbles = this.getMarbles();

    for (let i = marbles.length - 1; i >= 0; i--) {
      const marble = marbles[i];
      this.removePreviewLine(marble.id());
    }
  }

  getPreviewPointsFromMarble(marble: Marble) {
    const points: number[] = [];
    for (let i = 0; i < this.previewFrames.length; i++) {
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
    // TODO: improve performance
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

  disablePreview() {
    this.physics.postMessage({
      action: "disable preview",
      bodies: this.initialState,
    });
    this.physicsBusy = true;
    if (!this.previewOnPlayback) {
      this.removePreviewLines();
    }
  }

  cleanup() {
    this.removePreviewLines();
    for (let i = this.bodies.length - 1; i >= 0; i--) {
      const body = this.bodies[i];
      body.cleanup();
      this.bodies.pop();
    }
    this.bodiesMap.clear();
    this.bodyTrackedByCamera = null;
    this.lastPinchCenter = null;
    this.lastPinchDistance = 0;
    this.dragStopped = false;
  }

  destroy() {
    this.stop(this);
    this.cleanup();
    this.physics.terminate();
  }

  initialize(bodies?: Omit<SerializedBody, "canvasId">[], enablePreview = false) {
    if (bodies) {
      if (this.bodies.length) {
        this.cleanup();
      }

      for (let i = 0; i < bodies.length; i++) {
        const body = bodies[i];
        switch (body.type) {
          case "marble":
            if (body.radius && body.gradientStart && body.gradientEnd)
              new Marble(
                this,
                body.x,
                body.y,
                body.rotation,
                body.radius,
                body.gradientStart,
                body.gradientEnd,
                body.cameraTracking || false,
              );
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
            if (body.width && body.height && body.gradientStart && body.gradientEnd && body.volume)
              new NoteBlock(
                this,
                body.x,
                body.y,
                body.rotation,
                body.width,
                body.height,
                body.gradientStart,
                body.gradientEnd,
                body.note || "auto",
                body.octave || "auto",
                body.volume,
              );
            break;
        }
      }
    }
    this.initialState = this.bodies.map((body) => body.initialState);
    this.unrenderedFrames = [];
    this.renderedFrames = [];
    this.previewFrames = [];
    if (enablePreview) {
      this.physics.postMessage({
        action: "enable preview",
        bodies: this.initialState,
      });
    } else {
      if (!this.physicsBusy) {
        this.physics.postMessage({
          action: "initialize",
          bodies: this.initialState,
        });
      } else {
        this.physics.postMessage({
          action: "update preview",
        });
      }
      this.physicsBusy = true;
    }
  }

  toggleDraggableBodies() {
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];

      if (this.disableTransformer) {
        body.draggable(false);
      } else {
        body.draggable(true);
      }
    }
  }

  requestPhysicsUpdate() {
    this.physics.postMessage({
      action: "update",
    });
  }

  update(delta: number) {
    const afterUpdateNextFrame = (self: WorkspaceEditor, nextFrame: Frame) => {
      if (nextFrame?.lastFrame) {
        self.stop(self);
      }

      if (nextFrame?.hasNote) {
        const bodyWithNote = nextFrame.bodies.find((body) => body.playNote);
        if (!nextFrame.playedNote && bodyWithNote) {
          this.music?.playNote(bodyWithNote);
        }
        nextFrame.playedNote = true;
      }
    };

    if (this.unrenderedFrames.length <= FRAME_CACHE_SIZE && !this.physicsBusy) {
      this.requestPhysicsUpdate();
      this.physicsBusy = true;
    }

    let nextFrame = this.unrenderedFrames[0];
    afterUpdateNextFrame(this, nextFrame);
    if (!nextFrame) return;

    let remainingRenderTime = DELTA - nextFrame.timeSpentRendering;
    while (delta > remainingRenderTime && this.unrenderedFrames[1]) {
      delta -= remainingRenderTime;
      nextFrame = this.unrenderedFrames[1];
      afterUpdateNextFrame(this, nextFrame);
      remainingRenderTime = DELTA - nextFrame.timeSpentRendering;
      this.unrenderedFrames.shift();
    }

    const deltaRatio = delta / remainingRenderTime; // <= 1 ? delta / remainingRenderTime : DELTA;

    for (let i = 0; i < nextFrame.bodies.length; i++) {
      if (!this.playing) return;
      const serializedBody = nextFrame.bodies[i];
      const body = this.bodiesMap.get(serializedBody.canvasId);
      if (!body) continue;

      if (body instanceof Marble && body.cameraTracking) {
        const newX = -serializedBody.x * this.stage.scaleX() + this.stage.width() / 2;
        const newY = -serializedBody.y * this.stage.scaleY() + this.stage.height() / 2;
        this.stage.x(lerp(this.stage.x(), newX, deltaRatio));
        this.stage.y(lerp(this.stage.y(), newY, deltaRatio));
      }

      body.x(lerp(body.x(), serializedBody.x, deltaRatio));
      body.y(lerp(body.y(), serializedBody.y, deltaRatio));
      body.rotation(lerp(body.rotation(), radToDeg(serializedBody.rotation), deltaRatio));
    }

    nextFrame.timeSpentRendering += delta;
    if (nextFrame.timeSpentRendering > DELTA) this.unrenderedFrames.shift();
  }

  draw(self: WorkspaceEditor, time: number, firstCall = false) {
    const delta = firstCall ? DELTA : time - self.previousDrawTime;
    self.previousDrawTime = time;
    if (!self.playing || !self.music) return;

    self.update(delta);

    requestAnimationFrame((time) => self.draw(self, time));
  }

  play(self: WorkspaceEditor) {
    !self.disableTransformer && self.disablePreview();
    self.playing = true;
    self.disableTransformer = true;
    self.toggleDraggableBodies();

    if (self.bodyTrackedByCamera) {
      self.stage.draggable(false);
    }

    requestAnimationFrame((time) => self.draw(self, time, true));
  }

  pause(self: WorkspaceEditor) {
    self.playing = false;
    self.stage.draggable(true);
  }

  stop(self: WorkspaceEditor) {
    self.playing = false;
    self.stage.draggable(true);
    self.disableTransformer = false;
    self.initialize(self.initialState, true);
    if (self.stopCallback) {
      self.stopCallback();
    }
    if (self.bodyTrackedByCamera) {
      self.recenter();
    }
  }

  handlePhysicsResponse(self: WorkspaceEditor, event: CanvasMessageEvent) {
    if (event.data.action === "initialize") {
      self.physicsBusy = false;
      if (this.needsPreviewUpdate) {
        this.initialize();
        this.needsPreviewUpdate = false;
      }
    }

    if (event.data.action === "preview") {
      self.previewFrames = [];
      event.data.frames && self.previewFrames.push(...event.data.frames);
      self.updatePreviewLines();
    }

    if (event.data.action === "update") {
      event.data.frames && self.unrenderedFrames.push(...event.data.frames);
      self.physicsBusy = false;
    }
  }
}
