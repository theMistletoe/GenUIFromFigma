import { DetailedNodeInfo, UI_CHANNEL } from "@ui/app.network";
import { useEffect, useState } from "react";
import "@ui/styles/main.scss";
import { PLUGIN } from "@common/networkSides";

interface StyleNode {
  styles: Record<string, string | number | undefined>;
  svg?: string;
  children?: StyleNode[];
  content?: string;
  type: string;
}

function App() {
  const [selectedNodes, setSelectedNodes] = useState<DetailedNodeInfo[]>([]);
  const [svgString, setSvgString] = useState<string | undefined>(undefined);
  const [componentName, setComponentName] = useState<string | undefined>(undefined);
  const [openAIToken, setOpenAIToken] = useState<string | undefined>(undefined);
  const [generatedComponentByAI, setGeneratedComponentByAI] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);


  useEffect(() => {

    UI_CHANNEL.subscribe("selectionChange", (nodeInfos: DetailedNodeInfo[]) => {
      setSelectedNodes(nodeInfos);
    });

    UI_CHANNEL.subscribe("svgPreview", (svgString: string) => {
      setSvgString(svgString);
    });

    UI_CHANNEL.subscribe("getOpenAIToken", (token: string) => {
      console.log("XXXXXXXXXXXXXXXX", token);
      setOpenAIToken(token);
    });

    UI_CHANNEL.request(PLUGIN, "getOpenAIToken", []);
  }, []);

  const generateReactComponent = (componentName: string, nodes: StyleNode[]): string => {
    const generateTSXForNode = (node: StyleNode, index: number): string => {
      if (node.svg) {
        return `<div style={${JSON.stringify(node.styles)}}>
          ${node.svg}
        </div>`;
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
      if (node.type === 'VECTOR') {
          styleNode.svg = node.svg;
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

  function saveOpenAIToken () {
    if (!openAIToken) return;
    UI_CHANNEL.request(PLUGIN, "saveOpenAIToken", [openAIToken]);
  };

  function generateReactComponentByAI() {
    if (!openAIToken) return window.alert("OpenAI API Tokenが設定されていません。");
    if (!componentName) return window.alert("コンポーネント名が設定されていません。");
    setIsGenerating(true);
    try {
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIToken}`,
      },
      body: JSON.stringify({
        model: "o1-preview",
        messages: [{ role: "user", content: `
# 要望

- FigmaでデザインしたコンポーネントをReact/TypeScriptでそのまま利用できる動作するコードを出力してください。

# 要求詳細

Figmaから出力した情報を以下の通り提示します。

## 作成したいコンポーネント


${componentName}


## デザイン・見た目

\`\`\`svg
${svgString}
\`\`\`


## 構成ノード情報

\`\`\`json
${JSON.stringify(selectedNodes, null, 2)}
\`\`\`

# 制約

- 出力するコードにはTailwindCSSなどのcssライブラリを使用しないでください。
- 出力するコードにはReact/TypeScriptのみを使用してください。
- 出力するコードはsvgによる見た目、及び提供する構成ノード情報のcssInfosを分析しながら、正確にデザインを再現してください。
- 結果については生成したコード部分のみを出力してください。\`\`\`などのコードブロックは出力しないでください。これは絶対です。

          ` }],
      }),
    }).then((response) => {
      response.json().then((data) => {
        console.log("data", data);
        setGeneratedComponentByAI(data.choices[0].message.content);
      });
    });
    } catch (error) {
      console.error("Error generating component by AI", error);
    } finally {
      setIsGenerating(false);
    }

// 以下の情報もプロンプトに入れてたけど、精度がいまいちなのでやめた
// ## モックアップコード
// \`\`\`tsx
// ${generateSampleComponent(selectedNodes[0])}
// \`\`\`

  }

  return (
    <div className="homepage">

      <div>
        <h2>OpenAI API Token:</h2>
        <input type="text" value={openAIToken} onChange={(e) => setOpenAIToken(e.target.value)} />
        <button onClick={saveOpenAIToken}>トークンを保存</button>
      </div>

      {selectedNodes.length > 0 && (
        <div>
          <h2>生成したいUI部品:</h2>
          <input type="text" value={componentName} onChange={(e) => setComponentName(e.target.value)} />
        </div>
      )}

      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        {renderSelectionInfo()}
      </div>
      <div>
        <h3>SVG Preview</h3>
        {renderSvgPreview(svgString)}
      </div>
      <div>
        <h3>Reactコンポーネントを生成</h3>
        <button onClick={generateReactComponentByAI}>生成</button>
      </div>
      {isGenerating && <div style={{ marginTop: '20px' }}>生成中...</div>}
      {generatedComponentByAI && (
        <div>
          <h3>生成したReactコンポーネント</h3>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '10px',
          overflow: 'auto',
          height: '500px',
          textAlign: 'left'
        }}>
          {generatedComponentByAI}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
