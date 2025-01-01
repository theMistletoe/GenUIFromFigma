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

  async function getDetailedNodeInfo(node: SceneNode): Promise<DetailedNodeInfo> {
    // 基本情報は常に取得できる
    const baseInfo: DetailedNodeInfo = {
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
      opacity: 'opacity' in node ? node.opacity : 1
    };

    // CSSとSVGの取得を個別に試行
    try {
      baseInfo.cssInfos = await node.getCSSAsync();
    } catch (error) {
      console.warn(`CSS情報の取得に失敗: ${node.name}`, error);
      baseInfo.cssInfos = undefined;
    }

    try {
      baseInfo.svg = await node.exportAsync({ format: 'SVG_STRING' });
    } catch (error) {
      console.warn(`SVGエクスポートに失敗: ${node.name}`, error);
      baseInfo['svg'] = undefined;
    }

    // 子要素と型固有の情報も個別に処理
    if ('children' in node) {
      try {
        const childrenInfo = await Promise.all(node.children.map(child => getDetailedNodeInfo(child)));
        return {
          ...baseInfo,
          children: childrenInfo,
        };
      } catch (error) {
        console.warn(`子要素の情報取得に失敗: ${node.name}`, error);
        return baseInfo;
      }
    }

    // 型固有の情報を取得
    try {
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
    } catch (error) {
      console.warn(`型固有の情報取得に失敗: ${node.name}`, error);
      return baseInfo;
    }
  }

  figma.on("selectionchange", async () => {
    const nodes: DetailedNodeInfo[] = await Promise.all(
      figma.currentPage.selection.map(getDetailedNodeInfo)
    );
    PLUGIN_CHANNEL.emit(UI, "selectionChange", [nodes]);
  });

  figma.on("selectionchange", async () => {
    const nodes = figma.currentPage.selection;
    if (nodes.length === 0) return;
    const svgString = await nodes[0].exportAsync({ format: 'SVG_STRING' });
    PLUGIN_CHANNEL.emit(UI, "svgPreview", [svgString]);
  });
}

bootstrap();
