'use client'
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tabs, Tab, Textarea } from "@heroui/react";
import '../styles/tiptap-editor.scss';

interface MarkdownEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  title?: React.ReactNode;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Markdown 渲染组件
const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  return (
    <div id="tiptap-preview" className={`${className}`}>
      {content ? (
        <div className="prose-sm prose sm:prose lg:prose-lg xl:prose-2xl prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 自定义链接组件
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 underline hover:text-red-400"
                  {...props}
                >
                  {children}
                </a>
              ),
              // 自定义图片组件
              img: ({ src, alt, ...props }) => (
                <img
                  src={src}
                  alt={alt}
                  className="h-auto max-w-full rounded-lg"
                  {...props}
                />
              ),
              // 自定义表格组件
              table: ({ children, ...props }) => (
                <table className="w-full border border-collapse border-gray-600 table-auto" {...props}>
                  {children}
                </table>
              ),
              th: ({ children, ...props }) => (
                <th className="px-4 py-2 font-semibold text-left bg-gray-700 border border-gray-600" {...props}>
                  {children}
                </th>
              ),
              td: ({ children, ...props }) => (
                <td className="px-4 py-2 border border-gray-600" {...props}>
                  {children}
                </td>
              ),
              // 自定义代码块
              code: ({ children, ...props }) => {
                const isInline = !props.className?.includes('language-');
                return isInline ? (
                  <code className="px-2 py-1 font-mono text-sm text-red-400 bg-gray-700 rounded" {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="block p-4 overflow-x-auto font-mono text-sm text-white bg-gray-700 rounded-lg" {...props}>
                    {children}
                  </code>
                );
              },
              // 自定义引用块
              blockquote: ({ children, ...props }) => (
                <blockquote className="pl-4 italic text-gray-300 border-l-4 border-red-500" {...props}>
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full py-10 text-center0">
         <p>📝 No content</p>
        </div>
      )}
    </div>
  );
};

// 整合的 Markdown 编辑器组件（包含编辑和预览功能）
const MarkdownEditor = ({
  content = '',
  onChange,
  placeholder = '',
  className = '',
  title = ''
}: MarkdownEditorProps) => {
  const [markdown, setMarkdown] = useState(content || '');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // 同步外部传入的 content
  useEffect(() => {
    if (content !== undefined && content !== markdown) {
      setMarkdown(content);
    }
  }, [content]);

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value);
    onChange?.(value);
  };

  const handleTabChange = (tab: 'edit' | 'preview') => {
    setActiveTab(tab);
  };

  return (
    <div className={`${className}`}>
      {/* 标题区域 */}
      <div className='flex items-center w-full mb-4 space-x-4'>
        {title ? title : null}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => handleTabChange(key as 'edit' | 'preview')}
        >
          <Tab key="edit" title="Edit" />
          <Tab key="preview" title="Preview" />
        </Tabs>
      </div>

      {/* Tab 内容 */}
      <div>
        {activeTab === 'edit' && (
          <Textarea
            value={markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder={placeholder}
            variant="faded"
            minRows={25}
            isRequired
            label="Description"
          />
        )}
        {activeTab === 'preview' && (
          <MarkdownRenderer content={markdown} className='p-4 overflow-auto border-2 border-gray-200 rounded-xl ' />
        )}
      </div>
    </div>
  );
};

// 导出组件供外部使用
export {
  MarkdownEditor,
  MarkdownRenderer
};
