import Konva from "konva";

export class WorkspaceEditor {
  container: HTMLDivElement;
  stage: Konva.Stage;
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
    });
    this.sizeToContainer();

    this.interactLayer = new Konva.Layer();
    this.transformer = new Konva.Transformer();
    this.selection = new Konva.Rect({
      fill: "rgba(0, 0, 255, 0.5)",
      visible: false,
    });
    this.selectionVertices = {
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
    };
    this.stage.add(this.interactLayer);
    this.interactLayer.add(this.transformer);
    this.interactLayer.add(this.selection);
    this.listenForSelection();

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

  listenForSelection() {
    this.stage.on("mousedown touchstart", (event) => {
      if (event.target !== this.stage) return;
      const pointerPosition = this.stage.getPointerPosition();
      if (!pointerPosition) return;

      event.evt.preventDefault();
      this.selectionVertices = {
        x1: pointerPosition.x,
        x2: pointerPosition.x,
        y1: pointerPosition.y,
        y2: pointerPosition.y,
      };

      this.selection.visible(true);
      this.selection.width(0);
      this.selection.height(0);
    });

    this.stage.on("mousemove touchmove", (event) => {
      if (!this.selection.visible()) return;
      const pointerPosition = this.stage.getPointerPosition();
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
    });

    this.stage.on("mouseup touchend", (event) => {
      if (!this.selection.visible()) return;

      event.evt.preventDefault();
      setTimeout(() => this.selection.visible(false));

      const box = this.selection.getClientRect();
      const selected = this.bodies.filter((body) => Konva.Util.haveIntersection(box, body.getClientRect()));
      this.transformer.nodes(selected);
    });

    this.stage.on("click tap", (event) => {
      if (this.selection.visible()) return;
      if (event.target === this.stage) return;

      const metaPressed = event.evt.shiftKey || event.evt.ctrlKey || event.evt.metaKey;
      const isSelected = this.transformer.nodes().includes(event.target);

      if (!metaPressed && !isSelected) {
        this.transformer.nodes([event.target]);
      } else if (metaPressed && isSelected) {
        this.transformer.nodes(this.transformer.nodes().filter((node) => node !== event.target));
      } else if (metaPressed && !isSelected) {
        this.transformer.nodes([...this.transformer.nodes(), event.target]);
      }
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
    const testRect = new Konva.Rect({
      x: 60,
      y: 60,
      width: 100,
      height: 50,
      fill: "darkred",
      name: "rect",
      draggable: true,
    });
    const testRect2 = new Konva.Rect({
      x: 180,
      y: 60,
      width: 100,
      height: 50,
      fill: "darkred",
      name: "rect",
      draggable: true,
    });
    this.addBodies([testRect, testRect2]);
  }
}
