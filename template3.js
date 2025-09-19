// =====================================
// OPTION 1: REACT QUILL (Most Popular)
// =====================================
// Installation: npm install react-quill quill

import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

const RichTextWithQuill = () => {
  const [content, setContent] = useState('');

  // Quill configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'font', 'align', 
    'blockquote', 'code-block', 'list', 'bullet', 'indent',
    'link', 'image', 'video'
  ];

  return (
    <div className="h-96">
      <ReactQuill
        value={content}
        onChange={setContent}
        modules={modules}
        formats={formats}
        placeholder="Write your email content here..."
        style={{ height: '300px' }}
      />
    </div>
  );
};

// =====================================
// OPTION 2: TINYMCE
// =====================================
// Installation: npm install @tinymce/tinymce-react

import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const RichTextWithTinyMCE = () => {
  const editorRef = useRef(null);
  const [content, setContent] = useState('');

  const handleEditorChange = (content, editor) => {
    setContent(content);
  };

  return (
    <Editor
      apiKey="your-tinymce-api-key" // Get free API key from TinyMCE
      onInit={(evt, editor) => editorRef.current = editor}
      initialValue="<p>Start writing your email...</p>"
      init={{
        height: 400,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
      }}
      onEditorChange={handleEditorChange}
    />
  );
};

// =====================================
// OPTION 3: DRAFT.JS (Facebook's editor)
// =====================================
// Installation: npm install draft-js react-draft-wysiwyg

import React, { useState } from 'react';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const RichTextWithDraftJS = () => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  const onEditorStateChange = (editorState) => {
    setEditorState(editorState);
  };

  // Convert to HTML when needed
  const getHTML = () => {
    return draftToHtml(convertToRaw(editorState.getCurrentContent()));
  };

  // Set HTML content
  const setHTMLContent = (html) => {
    const contentBlock = htmlToDraft(html);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
      const editorState = EditorState.createWithContent(contentState);
      setEditorState(editorState);
    }
  };

  return (
    <div className="border rounded-lg">
      <Editor
        editorState={editorState}
        wrapperClassName="wrapper-class"
        editorClassName="editor-class"
        toolbarClassName="toolbar-class"
        onEditorStateChange={onEditorStateChange}
        toolbar={{
          options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'emoji', 'image', 'remove', 'history'],
          inline: { inDropdown: true },
          list: { inDropdown: true },
          textAlign: { inDropdown: true },
          link: { inDropdown: true },
          history: { inDropdown: true },
        }}
      />
    </div>
  );
};

// =====================================
// OPTION 4: SLATE.JS (Highly customizable)
// =====================================
// Installation: npm install slate slate-react slate-history

import React, { useMemo, useState, useCallback } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';

const RichTextWithSlate = () => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'Start typing your email content...' }],
    },
  ]);

  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback(props => {
    return <Leaf {...props} />;
  }, []);

  return (
    <div className="border rounded-lg p-4 min-h-[300px]">
      <Slate editor={editor} value={value} onChange={setValue}>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Enter some rich text…"
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  );
};

const CodeElement = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  );
};

const DefaultElement = props => {
  return <p {...props.attributes}>{props.children}</p>;
};

const Leaf = props => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
    >
      {props.children}
    </span>
  );
};

// =====================================
// OPTION 5: JODIT EDITOR
// =====================================
// Installation: npm install jodit-react

import React, { useState, useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';

const RichTextWithJodit = () => {
  const editor = useRef(null);
  const [content, setContent] = useState('');

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing your email...',
    height: 400,
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'link', 'table', '|',
      'left', 'center', 'right', 'justify', '|',
      'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ]
  }), []);

  return (
    <JoditEditor
      ref={editor}
      value={content}
      config={config}
      tabIndex={1}
      onBlur={newContent => setContent(newContent)}
      onChange={newContent => {}}
    />
  );
};

// =====================================
// COMPARISON AND RECOMMENDATIONS
// =====================================

/*
1. REACT QUILL - Best for most projects
   ✅ Easy to implement
   ✅ Good documentation
   ✅ Lightweight
   ✅ Good mobile support
   ✅ Active maintenance
   
2. TINYMCE - Best for advanced features
   ✅ Very feature-rich
   ✅ Professional look
   ✅ Plugin ecosystem
   ❌ Requires API key (free tier available)
   ❌ Larger bundle size
   
3. DRAFT.JS - Best for custom implementations
   ✅ Highly customizable
   ✅ Facebook-backed
   ❌ Steeper learning curve
   ❌ More complex setup
   
4. SLATE.JS - Best for complete control
   ✅ Most customizable
   ✅ Modern architecture
   ❌ Complex implementation
   ❌ Requires more development time
   
5. JODIT EDITOR - Good middle ground
   ✅ Feature-rich
   ✅ No external dependencies
   ❌ Less popular
   ❌ Larger bundle size

RECOMMENDATION: Start with React Quill for most email template use cases.
*/

// =====================================
// ENHANCED EMAIL TEMPLATE COMPONENT WITH REACT QUILL
// =====================================

import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Save, Send, FileText, Trash2, Edit3 } from 'lucide-react';

const EmailTemplateEditor = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Custom Quill configuration for email templates
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'link'],
      ['image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'color', 'background', 'align', 
    'list', 'bullet', 'blockquote', 'link', 'image'
  ];

  // Your existing functions here (saveTemplate, loadTemplate, etc.)
  
  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with controls */}
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email Template Editor
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Template title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                <Save size={16} />
                Save Template
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Send size={16} />
                Send Email
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Rich Text Editor */}
          <div className="flex-1 p-6">
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={modules}
              formats={formats}
              placeholder="Start writing your email template..."
              style={{ height: '400px' }}
              className="mb-12"
            />
          </div>

          {/* Template List Sidebar */}
          <div className="w-full lg:w-80 border-l border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} />
              Saved Templates
            </h3>
            
            <div className="space-y-2">
              {/* Template list items */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
