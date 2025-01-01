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
  styles: Record<string, string | number | undefined>;
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
      // CSSプロパティをReactスタイルに変換する関数
      const convertCssToReactStyle = (cssProps: Record<string, string | number>) => {
        return Object.entries(cssProps).reduce((acc, [key, value]) => {
          const reactKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          
          let reactValue = value;
          
          if (typeof value === 'string') {
            // コメント内の相対単位を優先するプロパティ
            const relativeUnitsProps = ['line-height', 'font-size', 'letter-spacing'];
            
            if (relativeUnitsProps.includes(key) && value.includes('/*')) {
              const relativeMatch = value.match(/\/\*\s*([^*]+)\s*\*\//);
              if (relativeMatch) {
                reactValue = relativeMatch[1].trim();
                return { ...acc, [reactKey]: reactValue };
              }
            }

            // その他のプロパティの処理
            const actualValue = value.split(/\s*\/\*/)[0].trim();
            if (!actualValue.match(/^-?\d+\.?\d*(px|em|rem|%|vh|vw)$/)) {
              const numValue = parseFloat(actualValue);
              if (!isNaN(numValue)) {
                reactValue = numValue;
              } else {
                reactValue = actualValue;
              }
            } else {
              reactValue = actualValue;
            }
          }

          return {
            ...acc,
            [reactKey]: reactValue
          };
        }, {});
      };

      const styleNode: StyleNode = {
        styles: {
          ...(node.cssInfos ? convertCssToReactStyle(node.cssInfos) : {}),
        },
        type: node.type,
        content: node.characters,
      };

      // テキストノードの処理
      if (node.type === 'TEXT' && node.characters) {
        styleNode.content = node.characters;
      }

      // SVGプレビューが利用可能な場合
      // if (node.type === 'VECTOR' || node.type === 'STAR' || node.type === 'LINE' || 
      //   node.type === 'ELLIPSE' || node.type === 'POLYGON' || 
      //   node.type === 'RECTANGLE' || node.type === 'BOOLEAN_OPERATION') {
      //     node.
      // }

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
        {selectedNodes.map((node) => (
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
