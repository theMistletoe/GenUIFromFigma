import { PLUGIN, UI } from "@common/networkSides";
import { DetailedNodeInfo } from "@ui/app.network";

export const PLUGIN_CHANNEL = PLUGIN.channelBuilder()
  .emitsTo(UI, (message) => {
    figma.ui.postMessage(message);
  })
  .receivesFrom(UI, (next) => {
    const listener: MessageEventHandler = (event) => next(event);
    figma.ui.on("message", listener);
    return () => figma.ui.off("message", listener);
  })
  .startListening();

// ---------- Message handlers

PLUGIN_CHANNEL.registerMessageHandler("ping", () => {
  return "pong";
});
PLUGIN_CHANNEL.registerMessageHandler("hello", (text) => {
  console.log("UI side said:", text);
});
PLUGIN_CHANNEL.registerMessageHandler("createRect", (width, height) => {
  if (figma.editorType === "figma") {
    const rect = figma.createRectangle();
    rect.x = 0;
    rect.y = 0;
    rect.name = "Plugin Rectangle # " + Math.floor(Math.random() * 9999);
    rect.fills = [
      {
        type: "SOLID",
        color: {
          r: Math.random(),
          g: Math.random(),
          b: Math.random(),
        },
      },
    ];
    rect.resize(width, height);
    figma.currentPage.appendChild(rect);
    figma.viewport.scrollAndZoomIntoView([rect]);
    figma.closePlugin();
  }
});
PLUGIN_CHANNEL.registerMessageHandler("selectionChange", (nodeInfos: DetailedNodeInfo[]) => {
  return nodeInfos;
});
PLUGIN_CHANNEL.registerMessageHandler("svgPreview", (svgString: string) => {
  return svgString;
});
PLUGIN_CHANNEL.registerMessageHandler("saveOpenAIToken", (token: string) => {
  console.log("saveOpenAIToken", token);
  figma.clientStorage.setAsync("openAIToken", token);
  return token;
});
PLUGIN_CHANNEL.registerMessageHandler("getOpenAIToken", () => {
  figma.clientStorage.getAsync("openAIToken").then((token) => {
    console.log("getOpenAIToken", token);
    // string に型をバリデーションする
    if (typeof token !== "string") {
      throw new Error("token is not a string");
    }
    PLUGIN_CHANNEL.emit(UI, "getOpenAIToken", [token]);
    return token;
  });
});
