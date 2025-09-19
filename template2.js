import React, { useState, useEffect, useRef } from 'react';
import { Save, Send, FileText, Trash2, Edit3 } from 'lucide-react';

// For React Quill (install: npm install react-quill quill)
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

// For TinyMCE (install: npm install @tinymce/tinymce-react)
// import { Editor } from '@tinymce/tinymce-react';

// Mock ReactQuill component for demonstration
const ReactQuill = ({ value, onChange, modules, formats, placeholder, style }) => {
  const editorRef = useRef(null);
  
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = (e) => {
    onChange(e.target.innerHTML);
  };

  return (
    <div style={style}>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{
          minHeight: '200px',
          border: '1px solid #ccc',
          padding: '12px',
          borderRadius: '4px',
          outline: 'none',
          backgroundColor: 'white'
        }}
        placeholder={placeholder}
      />
    </div>
  );
};

const RichTextEmailEditor = () => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // React Quill configuration
  const quillModules = {
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

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'font', 'align', 
    'blockquote', 'code-block', 'list', 'bullet', 'indent',
    'link', 'image', 'video'
  ];

  // Load templates (simulate API call)
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual Symfony API endpoint
      // const response = await fetch('/api/email-templates');
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockTemplates = [
        { id: 1, title: 'Welcome Email', content: '<h2>Welcome to our platform!</h2><p>Thank you for joining us.</p>' },
        { id: 2, title: 'Newsletter', content: '<h1>Monthly Newsletter</h1><p>Here are this month\'s updates...</p>' },
        { id: 3, title: 'Notification', content: '<p><strong>Important:</strong> Please review your account settings.</p>' }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!title.trim()) {
      alert('Please enter a template title');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        title: title.trim(),
        content: content,
        ...(selectedTemplate && { id: selectedTemplate.id })
      };

      // Replace with actual Symfony API call
      // const response = await fetch('/api/email-templates', {
      //   method: selectedTemplate ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(templateData)
      // });

      // Mock successful save
      if (selectedTemplate) {
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplate.id ? { ...t, title, content } : t
        ));
      } else {
        const newTemplate = { id: Date.now(), title, content };
        setTemplates(prev => [...prev, newTemplate]);
      }

      alert('Template saved successfully!');
      resetEditor();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setContent(template.content);
    setIsEditing(true);
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setLoading(true);
    try {
      // Replace with actual Symfony API call
      // await fetch(`/api/email-templates/${templateId}`, { method: 'DELETE' });

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      if (selectedTemplate && selectedTemplate.id === templateId) {
        resetEditor();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    if (!content.trim()) {
      alert('Please add some content before sending');
      return;
    }

    const recipient = prompt('Enter recipient email address:');
    if (!recipient) return;

    setLoading(true);
    try {
      // Replace with actual Symfony API call for sending emails
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: recipient,
      //     subject: title || 'Email from Rich Text Editor',
      //     htmlContent: content
      //   })
      // });

      alert(`Email would be sent to: ${recipient}`);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    } finally {
      setLoading(false);
    }
  };

  const resetEditor = () => {
    setContent('');
    setTitle('');
    setSelectedTemplate(null);
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Rich Text Email Template Editor
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="text"
              placeholder="Template title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex gap-2">
              <button
                onClick={saveTemplate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Save size={16} />
                Save Template
              </button>
              
              <button
                onClick={sendEmail}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={16} />
                Send Email
              </button>
              
              <button
                onClick={resetEditor}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Edit3 size={16} />
                New
              </button>
            </div>
                      </div>
          </div>

          {/* Rich Text Editor */}
          <div className="flex-1 p-6">
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Start typing your email content..."
              style={{ height: '400px', marginBottom: '50px' }}
            />
          </div>

          {/* Template List */}
          <div className="w-full lg:w-80 border-l border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} />
              Saved Templates
            </h3>
            
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                      selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4
                        className="font-medium text-sm truncate flex-1"
                        onClick={() => loadTemplate(template)}
                      >
                        {template.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(template.id);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Delete template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div
                      className="text-xs text-gray-600 mt-1 truncate"
                      onClick={() => loadTemplate(template)}
                      dangerouslySetInnerHTML={{
                        __html: template.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...'
                      }}
                    />
                  </div>
                ))}
                
                {templates.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No templates saved yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichTextEmailEditor;
