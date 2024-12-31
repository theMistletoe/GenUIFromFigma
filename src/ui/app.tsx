import { PLUGIN } from "@common/networkSides";
import { DetailedNodeInfo, UI_CHANNEL } from "@ui/app.network";
import { Button } from "@ui/components/Button";
import { Networker } from "monorepo-networker";
import { useEffect, useState } from "react";

import figmaLogo from "@ui/assets/figma.png";
import ReactLogo from "@ui/assets/react.svg?component";
import viteLogo from "@ui/assets/vite.svg?url";

import "@ui/styles/main.scss";

function App() {
  const [count, setCount] = useState(0);
  const [pingCount, setPingCount] = useState(0);
  const [selectedNodes, setSelectedNodes] = useState<DetailedNodeInfo[]>([]);
  const [svgString, setSvgString] = useState<string | undefined>(undefined);
  useEffect(() => {
    console.log("selectedNodes", selectedNodes);
  }, [selectedNodes]);

  useEffect(() => {
    UI_CHANNEL.subscribe("ping", () => {
      setPingCount((cnt) => cnt + 1);
    });

    UI_CHANNEL.subscribe("selectionChange", (nodeInfos: DetailedNodeInfo[]) => {
      setSelectedNodes(nodeInfos);
    });

    UI_CHANNEL.subscribe("svgPreview", (svgString: string) => {
      setSvgString(svgString);
    });
  }, []);

  const renderSelectionInfo = () => {
    if (selectedNodes.length === 0) {
      return <p>ノードが選択されていません</p>;
    }

    return (
      <div>
        <h3>選択されたノード:</h3>
        {selectedNodes.map((node, index) => (
          <div key={node.id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {JSON.stringify(node, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  function renderSvgPreview(svgString: string | undefined) {
    if (!svgString) return null;

    return (
      <div dangerouslySetInnerHTML={{ __html: svgString }} />
    );
  }

  return (
    <div className="homepage">
      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        {renderSelectionInfo()}
      </div>
      <div>
        <h3>SVG Preview</h3>
        {renderSvgPreview(svgString)}
      </div>
    </div>
  );
}

export default App;
