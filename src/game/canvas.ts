import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { RectConfig } from "konva/lib/shapes/Rect";
import { GetSet } from "konva/lib/types";
import { Frame, SerializedBody, WorkerAction } from "./physics";
import { radToDeg, degToRad } from "./common";

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
}

export class WorkspaceEditor {
  container: HTMLDivElement;
  initialState: (SerializedBody | Omit<SerializedBody, "canvasId">)[];
  stage: Konva.Stage;
  stageOffset: { offsetX: number; offsetY: number };
  backgroundLayer: Konva.Layer;
  interactLayer: Konva.Layer;
  transformer: Konva.Transformer;
  selection: Konva.Rect;
  selectionVertices: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  };
  bodies: Body[];
  physics: Worker;

  constructor(container: HTMLDivElement, initialState: Omit<SerializedBody, "canvasId">[] = []) {
    this.container = container;
    this.physics = new Worker("./src/game/physics.ts", { type: "module" });
    this.bodies = [];
    this.stage = new Konva.Stage({
      container: this.container,
      draggable: true,
    });
    this.stageOffset = {
      offsetX: 0,
      offsetY: 0,
    };
    this.sizeToContainer();

    this.backgroundLayer = new Konva.Layer();
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

    this.physics.addEventListener("message", this.handlePhysicsResponse);
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

  listenForPointerEvents() {
    this.stage.on("mousedown", (event) => {
      if (event.target !== this.stage) return this.stage.draggable(false);
      if (event.evt.button !== 0) return;

      this.selectionStart(event);
    });

    this.stage.on("mousemove", (event) => {
      if (!this.selection.visible()) return;
      this.selectionDrag(event);
    });

    this.stage.on("mouseup", (event) => {
      this.stage.draggable(true);
      if (!this.selection.visible()) return;

      this.selectionEnd(event);
    });

    this.stage.on("click tap", (event) => {
      if (this.selection.visible()) {
        this.transformer.nodes([]);
      }
      if (event.target === this.stage || event.target.parent !== this.interactLayer) {
        return this.transformer.nodes([]);
      }

      this.selectionTap(event);
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

  initialize(bodies?: Omit<SerializedBody, "canvasId">[]) {
    if (bodies) {
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
    this.physics.postMessage({
      action: "initialize",
      bodies: this.initialState,
    });
  }

  handlePhysicsResponse(event: CanvasMessageEvent) {
    console.log(event.data);
  }
}
