import { DetailedNodeInfo } from "@ui/app.network";
import { Networker } from "monorepo-networker";

export const UI = Networker.createSide("UI-side").listens<{
  ping(): "pong";
  hello(text: string): void;
  selectionChange(nodeInfos: DetailedNodeInfo[]): void;
  svgPreview(svgString: string): void;
}>();

export const PLUGIN = Networker.createSide("Plugin-side").listens<{
  ping(): "pong";
  hello(text: string): void;
  createRect(width: number, height: number): void;
  selectionChange(nodeInfos: DetailedNodeInfo[]): void;
  svgPreview(svgString: string): void;
}>();
