import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { CircleConfig } from "konva/lib/shapes/Circle";
import { RectConfig } from "konva/lib/shapes/Rect";
import { GetSet } from "konva/lib/types";

class Marble extends Konva.Circle {
  workspace: WorkspaceEditor;
  previousScaleX: number;
  previousScaleY: number;

  constructor(
    workspace: WorkspaceEditor,
    x: number,
    y: number,
    rotation: number,
    radius: number,
    gradientStart: string,
    gradientEnd: string,
    otherOptions: CircleConfig = {},
  ) {
    super({
      x,
      y,
      rotation,
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
      name: "marble",
      ...otherOptions,
    });
    this.workspace = workspace;
    this.workspace.addBody(this);

    this.previousScaleX = this.scaleX();
    this.previousScaleY = this.scaleY();
    this.on("transform", (event) => {
      this.skewX(0);
      this.skewY(0);
      if (this.previousScaleX !== event.target.scaleX()) {
        this.scaleY(this.scaleX());
      } else if (this.previousScaleY !== event.target.scaleY()) {
        this.scaleX(this.scaleY());
      }
      this.previousScaleX = this.scaleX();
      this.previousScaleY = this.scaleY();
    });
  }
}

class TrackBlock extends Konva.Rect {
  static xOffset = 5;
  static yOffset = -5;
  workspace: WorkspaceEditor;
  backTrack: Konva.Rect;

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
      rotation,
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
      name: "track-block",
      ...otherOptions,
    });
    this.backTrack = new Konva.Rect({
      x: x + TrackBlock.xOffset,
      y: y + TrackBlock.yOffset,
      rotation,
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
    this.workspace = workspace;
    this.workspace.backgroundLayer.add(this.backTrack);
    this.workspace.addBody(this);

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
}

class NoteBlock extends Konva.Rect {
  static xOffset = 3;
  static yOffset = 6;
  workspace: WorkspaceEditor;

  constructor(
    workspace: WorkspaceEditor,
    x: number,
    y: number,
    rotation: number,
    width: number,
    height: number,
    gradientStart: string,
    gradientEnd: string,
    otherOptions: RectConfig = {},
  ) {
    super({
      x,
      y,
      rotation,
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
      name: "note-block",
      draggable: true,
      ...otherOptions,
    });
    this.workspace = workspace;
    this.workspace.addBody(this);

    this.on("transform", () => {
      this.width(this.width() * this.scaleX());
      this.scaleX(1);
      this.height(this.height() * this.scaleY());
      this.scaleY(1);
    });
  }
}

export class WorkspaceEditor {
  container: HTMLDivElement;
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
  bodies: Konva.Node[];

  constructor(container: HTMLDivElement) {
    this.container = container;
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

    this.bodies = [];
    this.addTestShapes();
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

    this.selection.visible(true);
    this.selection.width(0);
    this.selection.height(0);
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
    setTimeout(() => this.selection.visible(false));

    const box = this.selection.getClientRect();
    const selected = this.bodies.filter((body) => Konva.Util.haveIntersection(box, body.getClientRect()));
    this.transformer.nodes(selected);
  }

  selectionTap(event: KonvaEventObject<MouseEvent>) {
    if (!this.bodies.includes(event.target)) return;
    const metaPressed = event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey;
    const isSelected = this.transformer.nodes().includes(event.target);

    if (!metaPressed && !isSelected) {
      this.transformer.nodes([event.target]);
    } else if (metaPressed && isSelected) {
      this.transformer.nodes(this.transformer.nodes().filter((node) => node !== event.target));
    } else if (metaPressed && !isSelected) {
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
      this.stage.draggable(true);
      if (this.selection.visible()) return this.transformer.nodes([]);
      if (event.target === this.stage) return this.transformer.nodes([]);

      this.selectionTap(event);
    });
  }

  addBody(body: Konva.Shape) {
    this.bodies.push(body);
    this.interactLayer.add(body);
    this.transformer.moveToTop();
    this.selection.moveToTop();
  }

  addBodies(bodies: Konva.Shape[]) {
    bodies.forEach((body) => this.addBody(body));
  }

  addTestShapes() {
    new Marble(this, this.stage.width() / 2, this.stage.height() / 2, 1, 20, "white", "blue");
    new TrackBlock(this, 200, 200, 1, 200, 10, "lightgray", "gray");
    new NoteBlock(this, 100, 400, 1, 100, 50, "blue", "darkblue");
  }
}
