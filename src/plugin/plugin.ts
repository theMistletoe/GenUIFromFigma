import { PLUGIN, UI } from "@common/networkSides";
import { PLUGIN_CHANNEL } from "@plugin/plugin.network";
import { DetailedNodeInfo } from "@ui/app.network";
import { Networker } from "monorepo-networker";

async function bootstrap() {
  Networker.initialize(PLUGIN, PLUGIN_CHANNEL);

  if (figma.editorType === "figma") {
    figma.showUI(__html__, {
      width: 800,
      height: 650,
      title: "My Figma Plugin!",
    });
  } else if (figma.editorType === "figjam") {
    figma.showUI(__html__, {
      width: 800,
      height: 650,
      title: "My FigJam Plugin!",
    });
  }

  console.log("Bootstrapped @", Networker.getCurrentSide().name);

  PLUGIN_CHANNEL.emit(UI, "hello", ["Hey there, UI!"]);

  setInterval(() => PLUGIN_CHANNEL.emit(UI, "ping", []), 5000);

  function getDetailedNodeInfo(node: SceneNode): DetailedNodeInfo {
    const baseInfo = {
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
      locked: node.locked,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rotation: 'rotation' in node ? node.rotation : 0,
      opacity: 'opacity' in node ? node.opacity : 1,
    };

    // 子要素を持つノードタイプの場合、再帰的に情報を取得
    if ('children' in node) {
      const childrenInfo = node.children.map(child => getDetailedNodeInfo(child));
      return {
        ...baseInfo,
        children: childrenInfo,
      };
    }

    // その他のノードタイプに応じた追加情報を取得
    switch (node.type) {
      case 'RECTANGLE':
      case 'ELLIPSE':
      case 'POLYGON':
        return {
          ...baseInfo,
          fills: (node as DefaultShapeMixin).fills,
          strokes: (node as DefaultShapeMixin).strokes,
          strokeWeight: (node as DefaultShapeMixin).strokeWeight,
          cornerRadius: (node as RectangleNode).cornerRadius,
        };
      case 'TEXT':
        return {
          ...baseInfo,
          characters: (node as TextNode).characters,
          fontSize: (node as TextNode).fontSize,
          fontName: (node as TextNode).fontName,
        };
      default:
        return baseInfo;
    }
  }

  figma.on("selectionchange", () => {
    const nodes: DetailedNodeInfo[] = figma.currentPage.selection.map(getDetailedNodeInfo);
    PLUGIN_CHANNEL.emit(UI, "selectionChange", [nodes]);
  });
}

bootstrap();
