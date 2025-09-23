import React, { useState, useCallback, useMemo } from 'react';
import { createEditor, Transforms, Editor, Text, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, useSlate, useSelected, useFocused } from 'slate-react';
import { withHistory } from 'slate-history';

const VARIABLES = [
  { key: 'user.firstName', label: 'First Name', category: 'User' },
  { key: 'user.lastName', label: 'Last Name', category: 'User' },
  { key: 'user.email', label: 'Email', category: 'User' },
  { key: 'company.name', label: 'Company Name', category: 'Company' },
  { key: 'company.address', label: 'Company Address', category: 'Company' },
  { key: 'order.id', label: 'Order ID', category: 'Order' },
  { key: 'order.total', label: 'Order Total', category: 'Order' },
  { key: 'product.name', label: 'Product Name', category: 'Product' }
];

const CustomElement = (props) => {
  const { attributes, children, element } = props;
  return <p {...attributes}>{children}</p>;
};

const CustomLeaf = ({ attributes, children, leaf }) => {
  let style = {};
  
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  
  if (leaf.isVariable) {
    style = {
      display: 'inline-block',
      padding: '3px 8px',
      margin: '0 2px',
      backgroundColor: '#e3f2fd',
      border: '2px solid #2196f3',
      borderRadius: '6px',
      fontSize: '14px',
      color: '#1976d2',
      fontWeight: 600,
      fontFamily: 'monospace'
    };
  }
  
  return <span {...attributes} style={style}>{children}</span>;
};

const ToolbarButton = ({ active, onClick, children, title }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      background: active ? '#e3f2fd' : 'transparent',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '8px',
      margin: '2px',
      cursor: 'pointer',
      color: active ? '#1976d2' : '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    {children}
  </button>
);

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const insertVariable = (editor, variable) => {
  const variableText = `{{${variable.label}}}`;
  
  Transforms.insertText(editor, variableText, {
    variable: variable.key,
    isVariable: true
  });
};

const RichTextEditor = ({ value, onChange }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [showVariables, setShowVariables] = useState(false);

  const renderElement = useCallback(props => <CustomElement {...props} />, []);
  const renderLeaf = useCallback(props => <CustomLeaf {...props} />, []);

  const handleVariableSelect = (variable) => {
    insertVariable(editor, variable);
    setShowVariables(false);
  };

  const groupedVariables = VARIABLES.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {});

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f9f9f9'
          }}
        >
          <ToolbarButton
            title="Bold"
            active={isMarkActive(editor, 'bold')}
            onClick={(e) => {
              e.preventDefault();
              toggleMark(editor, 'bold');
            }}
          >
            <strong>B</strong>
          </ToolbarButton>
          
          <ToolbarButton
            title="Italic"
            active={isMarkActive(editor, 'italic')}
            onClick={(e) => {
              e.preventDefault();
              toggleMark(editor, 'italic');
            }}
          >
            <em>I</em>
          </ToolbarButton>
          
          <ToolbarButton
            title="Underline"
            active={isMarkActive(editor, 'underline')}
            onClick={(e) => {
              e.preventDefault();
              toggleMark(editor, 'underline');
            }}
          >
            <u>U</u>
          </ToolbarButton>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#ddd', margin: '0 8px' }} />

          <ToolbarButton
            title="Insert Variable"
            active={showVariables}
            onClick={(e) => {
              e.preventDefault();
              setShowVariables(!showVariables);
            }}
          >
            {'{x}'}
          </ToolbarButton>
        </div>

        <div style={{ padding: '16px' }}>
          <Slate
            editor={editor}
            initialValue={value}
            onChange={onChange}
          >
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Start typing your message..."
              style={{
                minHeight: '200px',
                fontSize: '16px',
                lineHeight: '1.5',
                outline: 'none'
              }}
            />
          </Slate>
        </div>
      </div>

      {showVariables && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '250px',
            maxHeight: '300px',
            overflowY: 'auto',
            marginTop: '4px'
          }}
        >
          {Object.entries(groupedVariables).map(([category, variables], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <hr style={{ margin: 0, border: '1px solid #f0f0f0' }} />}
              <div
                style={{
                  padding: '8px 16px',
                  fontWeight: '600',
                  color: '#666',
                  backgroundColor: '#f9f9f9',
                  fontSize: '14px'
                }}
              >
                {category}
              </div>
              {variables.map((variable) => (
                <div
                  key={variable.key}
                  onClick={() => handleVariableSelect(variable)}
                  style={{
                    padding: '8px 24px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {variable.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EmailFieldArray = ({ emails, setEmails }) => {
  const addEmail = () => {
    setEmails([...emails, '']);
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1976d2' }}>
          📧 Email Recipients
        </h3>
        <button
          onClick={addEmail}
          style={{
            background: 'linear-gradient(45deg, #2196f3, #21cbf3)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          + Add Email
        </button>
      </div>
      
      {emails.map((email, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="email"
              placeholder={`Email ${index + 1}`}
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${email && !isValidEmail(email) ? '#f44336' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2196f3'}
              onBlur={(e) => e.target.style.borderColor = email && !isValidEmail(email) ? '#f44336' : '#ddd'}
            />
            {email && !isValidEmail(email) && (
              <p style={{ color: '#f44336', fontSize: '12px', margin: '4px 0 0 0' }}>
                Please enter a valid email address
              </p>
            )}
          </div>
          <button
            onClick={() => removeEmail(index)}
            disabled={emails.length === 1}
            style={{
              background: emails.length === 1 ? '#ccc' : '#f44336',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: 'white',
              cursor: emails.length === 1 ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '6px'
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default function CustomForm() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [emails, setEmails] = useState(['']);
  const [editorValue, setEditorValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }]
    }
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const formData = {
      title,
      subject,
      emails: emails.filter(email => email.trim() !== ''),
      content: editorValue
    };
    
    console.log('Form Data:', formData);
    alert('Form submitted successfully! Check console for data.');
  };

  const isFormValid = title.trim() !== '' && 
                     subject.trim() !== '' && 
                     emails.some(email => email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        color: 'white',
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          margin: '0 0 16px 0',
          fontSize: '32px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
