import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Container,
  Card,
  CardContent,
  Stack,
  Fade,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlinedIcon,
  Functions as VariableIcon,
  Email as EmailIcon,
  Title as TitleIcon,
  Send as SendIcon
} from '@mui/icons-material';
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

const VariableElement = ({ attributes, children, element }) => {
  const selected = useSelected();
  const focused = useFocused();
  const variable = VARIABLES.find(v => v.key === element.variable);
  
  return (
    <span
      {...attributes}
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        margin: '0 2px',
        backgroundColor: selected && focused ? '#e3f2fd' : '#f5f5f5',
        border: `1px solid ${selected && focused ? '#2196f3' : '#ddd'}`,
        borderRadius: '4px',
        fontSize: '0.875rem',
        color: '#1976d2',
        fontWeight: 500,
        position: 'relative'
      }}
      contentEditable={false}
    >
      {variable ? `{{${variable.label}}}` : `{{${element.variable}}}`}
      {children}
    </span>
  );
};

const CustomElement = (props) => {
  const { attributes, children, element } = props;
  
  switch (element.type) {
    case 'variable':
      return <VariableElement {...props} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const CustomLeaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
};

const ToolbarButton = ({ active, onMouseDown, children, title }) => (
  <Tooltip title={title}>
    <IconButton
      size="small"
      onMouseDown={onMouseDown}
      sx={{
        color: active ? 'primary.main' : 'text.secondary',
        backgroundColor: active ? 'primary.light' : 'transparent',
        '&:hover': {
          backgroundColor: active ? 'primary.light' : 'action.hover'
        }
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
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
  const variableElement = {
    type: 'variable',
    variable: variable.key,
    children: [{ text: '' }]
  };
  
  Transforms.insertNodes(editor, variableElement);
  Transforms.move(editor);
};

const RichTextEditor = ({ value, onChange }) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [anchorEl, setAnchorEl] = useState(null);

  const renderElement = useCallback(props => <CustomElement {...props} />, []);
  const renderLeaf = useCallback(props => <CustomLeaf {...props} />, []);

  const handleVariableClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleVariableSelect = (variable) => {
    insertVariable(editor, variable);
    setAnchorEl(null);
  };

  const handleVariableClose = () => {
    setAnchorEl(null);
  };

  const groupedVariables = VARIABLES.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {});

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'grey.50'
          }}
        >
          <ToolbarButton
            title="Bold"
            active={isMarkActive(editor, 'bold')}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, 'bold');
            }}
          >
            <BoldIcon fontSize="small" />
          </ToolbarButton>
          
          <ToolbarButton
            title="Italic"
            active={isMarkActive(editor, 'italic')}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, 'italic');
            }}
          >
            <ItalicIcon fontSize="small" />
          </ToolbarButton>
          
          <ToolbarButton
            title="Underline"
            active={isMarkActive(editor, 'underline')}
            onMouseDown={(event) => {
              event.preventDefault();
              toggleMark(editor, 'underline');
            }}
          >
            <UnderlinedIcon fontSize="small" />
          </ToolbarButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />

          <ToolbarButton
            title="Insert Variable"
            active={false}
            onMouseDown={(event) => {
              event.preventDefault();
              handleVariableClick(event);
            }}
          >
            <VariableIcon fontSize="small" />
          </ToolbarButton>
        </Box>

        <Box sx={{ p: 2 }}>
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
        </Box>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleVariableClose}
        PaperProps={{
          sx: { minWidth: 200, maxHeight: 300 }
        }}
      >
        {Object.entries(groupedVariables).map(([category, variables], categoryIndex) => (
          <Box key={category}>
            {categoryIndex > 0 && <Divider />}
            <MenuItem disabled sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {category}
            </MenuItem>
            {variables.map((variable) => (
              <MenuItem
                key={variable.key}
                onClick={() => handleVariableSelect(variable)}
                sx={{ pl: 3 }}
              >
                {variable.label}
              </MenuItem>
            ))}
          </Box>
        ))}
      </Menu>
    </Box>
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

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon color="primary" />
          Email Recipients
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addEmail}
          size="small"
          variant="outlined"
        >
          Add Email
        </Button>
      </Box>
      
      {emails.map((email, index) => (
        <Fade in key={index}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              type="email"
              label={`Email ${index + 1}`}
              value={email}
              onChange={(e) => updateEmail(index, e.target.value)}
              error={email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
              helperText={email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Please enter a valid email address' : ''}
              variant="outlined"
              size="small"
            />
            <IconButton
              onClick={() => removeEmail(index)}
              color="error"
              size="small"
              sx={{ mt: 0.5 }}
              disabled={emails.length === 1}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Fade>
      ))}
    </Stack>
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={2}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mb: 4,
            color: 'primary.main',
            fontWeight: 600
          }}>
            <TitleIcon sx={{ fontSize: 36 }} />
            Custom Message Form
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <TextField
                fullWidth
                label="Message Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="outlined"
                required
                helperText="Enter a descriptive title for your message"
              />

              <TextField
                fullWidth
                label="Subject Line"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                variant="outlined"
                required
                helperText="This will be the email subject line"
              />

              <EmailFieldArray 
                emails={emails} 
                setEmails={setEmails} 
              />

              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Message Content
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use the toolbar to format your text and insert variables from your backend entities.
                </Typography>
                <RichTextEditor
                  value={editorValue}
                  onChange={setEditorValue}
                />
              </Box>

              <Box sx={{ pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  disabled={!isFormValid}
                  sx={{ 
                    minWidth: 200,
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  Send Message
                </Button>
                {!isFormValid && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Please fill in all required fields with valid data
                  </Typography>
                )}
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }} elevation={1}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Variables
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {VARIABLES.map((variable) => (
              <Chip
                key={variable.key}
                label={`{{${variable.label}}}`}
                size="small"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
