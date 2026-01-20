import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

function ResumeEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none min-h-[400px] p-4 border border-gray-300 rounded-lg'
            }
        }
    });

    useEffect(() => {
        if (editor && content) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div>
            {/* Toolbar */}
            <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex gap-2 flex-wrap">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-3 py-1 rounded ${editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-white'
                        }`}
                    type="button"
                >
                    <strong>B</strong>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-3 py-1 rounded ${editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-white'
                        }`}
                    type="button"
                >
                    <em>I</em>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-white'
                        }`}
                    type="button"
                >
                    • List
                </button>
                <button
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className="px-3 py-1 rounded bg-white"
                    type="button"
                >
                    Paragraph
                </button>
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="px-3 py-1 rounded bg-white disabled:opacity-50"
                    type="button"
                >
                    ↶ Undo
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="px-3 py-1 rounded bg-white disabled:opacity-50"
                    type="button"
                >
                    ↷ Redo
                </button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    );
}

export default ResumeEditor;