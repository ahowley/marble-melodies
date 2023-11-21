import { Component } from "solid-js";
import { BlockTypes } from "../../game/physics";
import "./Shape.scss";

type ShapeProps = {
  type: BlockTypes;
};
export const Shape: Component<ShapeProps> = (props) => {
  return <div class={props.type} />;
};
