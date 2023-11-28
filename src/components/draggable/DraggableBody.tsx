import { ParentComponent } from "solid-js";
import { createDraggable, transformStyle } from "@thisbeyond/solid-dnd";
import "./DraggableBody.scss";

type DraggableProps = {
  id: string | number;
};
export const DraggableBody: ParentComponent<DraggableProps> = (props) => {
  const draggable = createDraggable(props.id);

  return (
    <div
      class="draggable"
      classList={{ "is-dragging": draggable.isActiveDraggable }}
      style={transformStyle(draggable.transform)}
      ref={draggable.ref}
      {...draggable.dragActivators}
    >
      {props.children}
    </div>
  );
};
