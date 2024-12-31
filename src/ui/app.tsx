import { PLUGIN } from "@common/networkSides";
import { DetailedNodeInfo, UI_CHANNEL } from "@ui/app.network";
import { Button } from "@ui/components/Button";
import { Networker } from "monorepo-networker";
import { useEffect, useState } from "react";

import figmaLogo from "@ui/assets/figma.png";
import ReactLogo from "@ui/assets/react.svg?component";
import viteLogo from "@ui/assets/vite.svg?url";

import "@ui/styles/main.scss";

interface StyleNode {
  styles: Record<string, string | number>;
  svg?: string;
  children?: StyleNode[];
  content?: string;
  type: string;
}

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

  const generateReactComponent = (componentName: string, nodes: StyleNode[]): string => {
    const generateTSXForNode = (node: StyleNode, index: number): string => {
      if (node.svg) {
        return `<div 
          style={${JSON.stringify(node.styles)}}
          dangerouslySetInnerHTML={{ __html: \`${node.svg}\` }}
        />`;
      }

      if (node.content) {
        return `<div style={${JSON.stringify(node.styles)}}>
          ${node.content}
        </div>`;
      }

      if (node.children) {
        const childrenJSX = node.children
          .map((child, i) => generateTSXForNode(child, i))
          .join('\n');
        return `<div style={${JSON.stringify(node.styles)}}>
          ${childrenJSX}
        </div>`;
      }

      return `<div style={${JSON.stringify(node.styles)}} />`;
    };

    return `import React from 'react';

const ${componentName} = () => {
  return (
    ${nodes.map((node, i) => generateTSXForNode(node, i)).join('\n')}
  );
};

export default ${componentName};`;
  };

  const generateSampleComponent = (node: DetailedNodeInfo) => {
    const componentName = node.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    // ノードをStyleNode形式に変換する再帰的な関数
    const convertNodeToStyleNode = (node: DetailedNodeInfo): StyleNode => {
      const styleNode: StyleNode = {
        styles: {
          width: `${node.width}px`,
          height: `${node.height}px`,
          backgroundColor: (typeof node.fills !== 'symbol' && node.fills?.[0]?.type === 'SOLID' && node.fills[0].color?.toString()) || 'transparent',
          position: 'relative',
          ...(typeof node.strokes !== 'symbol' && node.strokes && node.strokes.length > 0 && node.strokeWeight && node.strokes[0].type === 'SOLID' && {
            border: `${String(node.strokeWeight)}px solid ${node.strokes[0].color?.toString()}`
          }),
          ...(node.cornerRadius && typeof node.cornerRadius !== 'symbol' && {
            borderRadius: `${String(node.cornerRadius)}px`
          })
        },
        type: node.type
      };

      // SVGプレビューが利用可能な場合
      if (svgString && node.type === 'VECTOR') {
        styleNode.svg = svgString;
      }

      // 子ノードが存在する場合、再帰的に処理
      if (node.children && node.children.length > 0) {
        styleNode.children = node.children.map(childNode => convertNodeToStyleNode(childNode));
      }

      return styleNode;
    };

    const styleNode = convertNodeToStyleNode(node);
    return generateReactComponent(componentName, [styleNode]);
  };

  const renderSelectionInfo = () => {
    if (selectedNodes.length === 0) {
      return <p>ノードが選択されていません</p>;
    }

    return (
      <div>
        <h3>選択されたノード:</h3>
        {selectedNodes.map((node, index) => (
          <div key={node.id} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h4>ノード情報:</h4>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {JSON.stringify(node, null, 2)}
            </pre>
            
            <h4>サンプルReactコンポーネント:</h4>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '10px'
            }}>
              {generateSampleComponent(node)}
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
