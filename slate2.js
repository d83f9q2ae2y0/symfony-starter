import React, { useMemo, useCallback } from 'react';
import { createEditor, Transforms, Editor, Range, Node } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';

const withCustom = (editor) => {
  const { deleteBackward, deleteForward } = editor;

  editor.deleteBackward = (...args) => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => n.aaa === true,
        universal: true,
      });

      if (match) {
        const [node, path] = match;
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    deleteBackward(...args);
  };

  editor.deleteForward = (...args) => {
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: n => n.aaa === true,
        universal: true,
      });

      if (match) {
        const [node, path] = match;
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    deleteForward(...args);
  };

  return editor;
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.aaa) {
    return (
      <span
        {...attributes}
        style={{
          backgroundColor: '#ffeb3b',
          color: '#1976d2',
          padding: '2px 4px',
          borderRadius: '4px',
          fontWeight: 'bold',
          border: '2px solid #1976d2'
        }}
      >
        {children}
      </span>
    );
  }

  return <span {...attributes}>{children}</span>;
};

const SlateEditor = () => {
  const editor = useMemo(() => withCustom(withReact(createEditor())), []);

  const initialValue = [
    {
      type: 'paragraph',
      children: [{ text: 'Type something here...' }],
    },
  ];

  const insertAAAText = useCallback(() => {
    const text = 'Special Text';
    
    Transforms.insertNodes(editor, {
      text,
      aaa: true,
    });
  }, [editor]);

  const renderLeaf = useCallback((props) => {
    return <Leaf {...props} />;
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={insertAAAText}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Insert AAA Text
      </button>
      
      <Slate editor={editor} initialValue={initialValue}>
        <Editable
          renderLeaf={renderLeaf}
          style={{
            border: '1px solid #ccc',
            padding: '20px',
            minHeight: '200px',
            borderRadius: '4px'
          }}
        />
      </Slate>
    </div>
  );
};

export default SlateEditor;
