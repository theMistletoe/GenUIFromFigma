import { PLUGIN, UI } from "@common/networkSides";

export type DetailedNodeInfo = {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  characters?: string;
  children?: DetailedNodeInfo[];
  cssInfos?: Record<string, string | number>;
  fills?: readonly Paint[] | symbol;
  strokes?: readonly Paint[] | symbol;
  strokeWeight?: number | symbol;
  strokeAlign?: string | symbol;
  cornerRadius?: number | symbol;
  fontSize?: number | symbol;
  fontName?: FontName | symbol;
  svg?: string;
};

export const UI_CHANNEL = UI.channelBuilder()
  .emitsTo(PLUGIN, (message) => {
    parent.postMessage({ pluginMessage: message }, "*");
  })
  .receivesFrom(PLUGIN, (next) => {
    const listener = (event: MessageEvent) => {
      if (event.data?.pluginId == null) return;
      next(event.data.pluginMessage);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  })
  .startListening();

// ---------- Message handlers

UI_CHANNEL.registerMessageHandler("ping", () => {
  return "pong";
});
UI_CHANNEL.registerMessageHandler("hello", (text: string) => {
  console.log("Plugin side said", text);
});
UI_CHANNEL.registerMessageHandler("selectionChange", (nodeInfos: DetailedNodeInfo[]) => {
  // 空の実装で問題ありません
});
UI_CHANNEL.registerMessageHandler("svgPreview", (svgString: string) => {
  // 空の実装で問題ありません
});
UI_CHANNEL.registerMessageHandler("saveOpenAIToken", (token: string) => {
  // 空の実装で問題ありません
});
UI_CHANNEL.registerMessageHandler("getOpenAIToken", (token: string) => {
  // 空の実装で問題ありません
});
