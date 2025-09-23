import React, { useState, useCallback, useMemo } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';

const MUISlateEditor = ({ 
  label = "Rich Text Editor",
  helperText = "",
  error = false,
  placeholder = "Enter text...",
  disabled = false,
  required = false,
  value,
  onChange,
  ...props 
}) => {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  const editor = useMemo(() => withReact(createEditor()), []);
  
  const currentValue = value || internalValue;
  const hasContent = currentValue.some(node => 
    node.children.some(child => child.text && child.text.trim().length > 0)
  );

  const handleChange = useCallback((newValue) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    if (!disabled) setFocused(true);
  }, [disabled]);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  // Determine colors based on state
  const getColors = () => {
    if (disabled) {
      return {
        border: '#e0e0e0',
        label: '#bdbdbd',
        helper: '#bdbdbd'
      };
    }
    if (error) {
      return {
        border: '#d32f2f',
        label: '#d32f2f',
        helper: '#d32f2f'
      };
    }
    if (focused) {
      return {
        border: '#1976d2',
        label: '#1976d2',
        helper: '#616161'
      };
    }
    return {
      border: 'rgba(0, 0, 0, 0.23)',
      label: '#616161',
      helper: '#616161'
    };
  };

  const colors = getColors();
  const labelFloated = focused || hasContent;

  return (
    <div className="mui-slate-container" style={{ marginBottom: '8px', width: '100%' }}>
      <div 
        className="mui-slate-wrapper"
        style={{
          position: 'relative',
          borderRadius: '4px',
          border: `${focused ? '2px' : '1px'} solid ${colors.border}`,
          backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
          transition: 'border-color 0.2s, border-width 0.2s',
          minHeight: '56px',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
        }}
        onClick={() => {
          if (!disabled) {
            editor.focus();
          }
        }}
      >
        {/* Floating Label */}
        <label
          style={{
            position: 'absolute',
            left: '14px',
            top: labelFloated ? '-9px' : '16px',
            fontSize: labelFloated ? '12px' : '16px',
            color: colors.label,
            backgroundColor: '#ffffff',
            padding: labelFloated ? '0 4px' : '0',
            transition: 'all 0.2s ease-out',
            pointerEvents: 'none',
            zIndex: 1,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            lineHeight: 1.4375,
          }}
        >
          {label}{required && ' *'}
        </label>

        {/* Slate Editor */}
        <div 
          style={{
            padding: '16.5px 14px',
            minHeight: '24px',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '16px',
            lineHeight: '1.4375',
            color: disabled ? '#bdbdbd' : 'rgba(0, 0, 0, 0.87)',
          }}
        >
          <Slate
            editor={editor}
            initialValue={currentValue}
            onValueChange={handleChange}
          >
            <Editable
              placeholder={labelFloated ? placeholder : ''}
              onFocus={handleFocus}
              onBlur={handleBlur}
              readOnly={disabled}
              style={{
                outline: 'none',
                border: 'none',
                background: 'transparent',
                width: '100%',
                minHeight: '20px',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
                color: 'inherit',
              }}
              {...props}
            />
          </Slate>
        </div>
      </div>

      {/* Helper Text */}
      {helperText && (
        <div
          style={{
            color: colors.helper,
            fontSize: '12px',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontWeight: 400,
            lineHeight: 1.66,
            letterSpacing: '0.03333em',
            marginTop: '3px',
            marginLeft: '14px',
            marginRight: '14px',
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

// Demo Component
const SlateEditorDemo = () => {
  const [value1, setValue1] = useState([
    {
      type: 'paragraph',
      children: [{ text: 'This is a pre-filled editor with some content.' }],
    },
  ]);

  const [value2, setValue2] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  const [value3, setValue3] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 400, 
        marginBottom: '24px',
        color: 'rgba(0, 0, 0, 0.87)'
      }}>
        MUI-styled Slate Editor Demo
      </h2>
      
      <div style={{ marginBottom: '24px' }}>
        <MUISlateEditor
          label="Rich Text Content"
          helperText="This editor has pre-filled content and will show the floating label"
          value={value1}
          onChange={setValue1}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <MUISlateEditor
          label="Description"
          helperText="Enter a detailed description of your content"
          placeholder="Start typing your description..."
          value={value2}
          onChange={setValue2}
          required
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <MUISlateEditor
          label="Error Example"
          helperText="This field has an error and shows error styling"
          error={true}
          value={value3}
          onChange={setValue3}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <MUISlateEditor
          label="Disabled Editor"
          helperText="This editor is disabled and cannot be edited"
          disabled={true}
        />
      </div>
    </div>
  );
};

export default SlateEditorDemo;
