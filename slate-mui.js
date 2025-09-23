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




//// v2

import React, { useState, useCallback, useMemo } from 'react';
import { createEditor } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import {
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  useTheme
} from '@mui/material';

const MUISlateEditor = ({ 
  label = "Rich Text Editor",
  helperText = "",
  error = false,
  placeholder = "Enter text...",
  disabled = false,
  required = false,
  value,
  onChange,
  fullWidth = true,
  margin = "normal",
  size = "medium",
  ...props 
}) => {
  const theme = useTheme();
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

  // Calculate padding based on size
  const getPadding = () => {
    if (size === 'small') return '8.5px 14px';
    return '16.5px 14px';
  };

  // Calculate min height based on size
  const getMinHeight = () => {
    if (size === 'small') return '40px';
    return '56px';
  };

  return (
    <FormControl
      variant="outlined"
      fullWidth={fullWidth}
      error={error}
      disabled={disabled}
      margin={margin}
      required={required}
      focused={focused}
    >
      <InputLabel
        shrink={focused || hasContent}
        sx={{
          '&.MuiInputLabel-root': {
            transform: (focused || hasContent) 
              ? 'translate(14px, -9px) scale(0.75)' 
              : `translate(14px, ${size === 'small' ? '12px' : '16px'}) scale(1)`,
          }
        }}
      >
        {label}
      </InputLabel>
      
      <Box
        sx={{
          position: 'relative',
          borderRadius: 1,
          border: (theme) => {
            if (disabled) return `1px solid ${theme.palette.action.disabled}`;
            if (error) return `2px solid ${theme.palette.error.main}`;
            if (focused) return `2px solid ${theme.palette.primary.main}`;
            return `1px solid ${theme.palette.divider}`;
          },
          backgroundColor: disabled 
            ? theme.palette.action.disabledBackground 
            : theme.palette.background.paper,
          minHeight: getMinHeight(),
          cursor: disabled ? 'not-allowed' : 'text',
          transition: theme.transitions.create([
            'border-color',
            'box-shadow',
          ]),
          '&:hover': !disabled && !focused && {
            borderColor: theme.palette.text.primary,
          },
        }}
        onClick={() => {
          if (!disabled) {
            editor.focus();
          }
        }}
      >
        <Box
          sx={{
            padding: getPadding(),
            minHeight: size === 'small' ? '1.4375em' : '1.4375em',
            fontFamily: theme.typography.body1.fontFamily,
            fontSize: theme.typography.body1.fontSize,
            lineHeight: theme.typography.body1.lineHeight,
            color: disabled 
              ? theme.palette.text.disabled 
              : theme.palette.text.primary,
          }}
        >
          <Slate
            editor={editor}
            initialValue={currentValue}
            onValueChange={handleChange}
          >
            <Editable
              placeholder={(focused || hasContent) ? placeholder : ''}
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
                resize: 'none',
              }}
              {...props}
            />
          </Slate>
        </Box>
      </Box>

      {helperText && (
        <FormHelperText>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

// Demo Component with MUI Theme
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

  const [value4, setValue4] = useState([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);

  return (
    <Box sx={{ 
      padding: 3, 
      maxWidth: 600, 
      margin: '0 auto',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      <Box sx={{ 
        typography: 'h4', 
        mb: 3,
        color: 'text.primary'
      }}>
        MUI-styled Slate Editor Demo
      </Box>
      
      <MUISlateEditor
        label="Rich Text Content"
        helperText="This editor has pre-filled content and will show the floating label"
        value={value1}
        onChange={setValue1}
        margin="normal"
      />

      <MUISlateEditor
        label="Description"
        helperText="Enter a detailed description of your content"
        placeholder="Start typing your description..."
        value={value2}
        onChange={setValue2}
        required
        margin="normal"
      />

      <MUISlateEditor
        label="Error Example"
        helperText="This field has an error and shows error styling"
        error={true}
        value={value3}
        onChange={setValue3}
        margin="normal"
      />

      <MUISlateEditor
        label="Disabled Editor"
        helperText="This editor is disabled and cannot be edited"
        disabled={true}
        margin="normal"
      />

      <MUISlateEditor
        label="Small Size Editor"
        helperText="This is a small sized editor"
        size="small"
        value={value4}
        onChange={setValue4}
        margin="normal"
      />
    </Box>
  );
};

export default SlateEditorDemo;
