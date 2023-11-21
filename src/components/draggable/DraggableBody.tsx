import { ParentComponent } from "solid-js";
import { createDraggable, transformStyle, useDragDropContext } from "@thisbeyond/solid-dnd";
import "./DraggableBody.scss";

type DraggableProps = {
  id: number;
};
export const DraggableBody: ParentComponent<DraggableProps> = (props) => {
  const draggable = createDraggable(props.id);

  return (
    <div
      class="draggable"
      style={transformStyle(draggable.transform)}
      ref={draggable.ref}
      {...draggable.dragActivators}
    >
      {props.children}
    </div>
  );
};
