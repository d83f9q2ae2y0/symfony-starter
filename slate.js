import React, { useMemo, useCallback, useState } from 'react';
import { createEditor, Transforms, Editor, Text, Range } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';

const AAA_TYPE = 'aaa';

const withAAALeaf = (editor) => {
  const { deleteBackward, deleteForward } = editor;

  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => Text.isText(n) && n[AAA_TYPE],
        universal: true,
      });

      if (match) {
        const [node, path] = match;
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    deleteBackward(unit);
  };

  editor.deleteForward = (unit) => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => Text.isText(n) && n[AAA_TYPE],
        universal: true,
      });

      if (match) {
        const [node, path] = match;
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    deleteForward(unit);
  };

  return editor;
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf[AAA_TYPE]) {
    return (
      <span
        {...attributes}
        style={{
          backgroundColor: '#ffeb3b',
          color: '#d32f2f',
          fontWeight: 'bold',
          border: '2px solid #ff9800',
          borderRadius: '4px',
          padding: '2px 4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {children}
      </span>
    );
  }

  return <span {...attributes}>{children}</span>;
};

export default function SlateAAALeafExample() {
  const editor = useMemo(() => withAAALeaf(withReact(createEditor())), []);
  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'Type some text and click the button to insert AAA text.' }],
    },
  ]);

  const insertAAAText = useCallback(() => {
    const aaaText = 'SPECIAL TEXT';
    
    Transforms.insertNodes(editor, {
      text: aaaText,
      [AAA_TYPE]: true,
    });
  }, [editor]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <button
        onClick={insertAAAText}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Insert AAA Text
      </button>
      
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '20px',
          minHeight: '200px',
          backgroundColor: '#fafafa'
        }}
      >
        <Slate
          editor={editor}
          initialValue={value}
          value={value}
          onChange={setValue}
        >
          <Editable
            renderLeaf={Leaf}
            placeholder="Start typing..."
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              outline: 'none'
            }}
          />
        </Slate>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Click the button to insert highlighted AAA text. When you delete any character from AAA text, the entire node will be removed.
      </div>
    </div>
  );
}
