import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify,
  faListUl,
  faListOl,
  faLink,
  faImage,
  faRotateLeft,
  faRotateRight,
  faRemoveFormat,
  faOutdent,
  faIndent
} from '@fortawesome/free-solid-svg-icons';

interface RichTextEditorProps {
  /** HTML content (controlled value) */
  value: string;
  /** Fired whenever the inner HTML changes */
  onChange: (html: string) => void;
  /** Editor height in px (default 260) */
  height?: number;
  /** Placeholder khi nội dung rỗng */
  placeholder?: string;
}

/**
 * WYSIWYG editor thuần React, không phụ thuộc thư viện ngoài.
 * Hỗ trợ: bold / italic / underline / strikethrough,
 * căn lề trái/phải/giữa/justify, bullet list, numbered list,
 * thụt lề / outdent, chèn link, chèn ảnh (base64), undo/redo, clear format.
 * Output là HTML string — tương thích với `dangerouslySetInnerHTML` của dự án.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  height = 260,
  placeholder = 'Nhập mô tả chi tiết...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** Đánh dấu đang đồng bộ value từ ngoài vào để tránh loop */
  const syncingRef = useRef(false);
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  /**
   * Đồng bộ value ngoài vào editor. Chỉ cập nhật khi DOM khác với value
   * để không làm mất con trỏ soạn thảo.
   */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML === value) return;
    syncingRef.current = true;
    el.innerHTML = value || '';
    syncingRef.current = false;
  }, [value]);

  /** Cập nhật trạng thái nút bấm (active/inactive) theo caret hiện tại */
  const refreshActiveStates = useCallback(() => {
    if (!document.queryCommandState) return;
    const cmds = [
      'bold', 'italic', 'underline', 'strikeThrough',
      'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
      'insertUnorderedList', 'insertOrderedList'
    ];
    const next: Record<string, boolean> = {};
    for (const c of cmds) {
      try {
        next[c] = document.queryCommandState(c);
      } catch {
        next[c] = false;
      }
    }
    setActiveStates(next);
  }, []);

  /** Thông báo HTML mới ra ngoài */
  const emitChange = useCallback(() => {
    if (syncingRef.current) return;
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html);
    refreshActiveStates();
  }, [onChange, refreshActiveStates]);

  /** Wrapper chạy lệnh execCommand + emit change */
  const exec = useCallback(
    (command: string, value?: string) => {
      // focus để lệnh tác dụng lên selection hiện tại
      editorRef.current?.focus();
      try {
        document.execCommand(command, false, value);
      } catch {
        /* ignore */
      }
      emitChange();
    },
    [emitChange]
  );

  /** Chèn link bằng prompt đơn giản */
  const insertLink = useCallback(() => {
    const url = window.prompt('Nhập URL liên kết:', 'https://');
    if (!url) return;
    const text = window.getSelection()?.toString() || url;
    const html = `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
    document.execCommand('insertHTML', false, html);
    emitChange();
  }, [emitChange]);

  /** Mở hộp chọn file ảnh, chèn base64 vào editor */
  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ''; // reset để chọn lại cùng file nếu cần
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        window.alert('Vui lòng chọn file ảnh.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || '');
        if (!src) return;
        document.execCommand('insertHTML', false, `<img src="${src}" alt="${escapeAttr(file.name)}" />`);
        emitChange();
      };
      reader.readAsDataURL(file);
    },
    [emitChange]
  );

  const btn = (active: boolean) =>
    `h-8 w-8 inline-flex items-center justify-center rounded-md text-sm transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
    }`;

  return (
    <div className="rich-text-editor flex flex-col bg-white border border-slate-300 rounded-xl overflow-hidden">
      {/* TOOLBAR */}
      <div
        className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-100 border-b border-slate-300"
        role="toolbar"
        aria-label="Thanh công cụ soạn thảo"
      >
        <button type="button" className={btn(activeStates.bold)} title="In đậm (Ctrl+B)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button type="button" className={btn(activeStates.italic)} title="In nghiêng (Ctrl+I)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')}>
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button type="button" className={btn(activeStates.underline)} title="Gạch chân (Ctrl+U)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')}>
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button type="button" className={btn(activeStates.strikeThrough)} title="Gạch ngang" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('strikeThrough')}>
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" />

        <button type="button" className={btn(activeStates.justifyLeft)} title="Căn trái" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')}>
          <FontAwesomeIcon icon={faAlignLeft} />
        </button>
        <button type="button" className={btn(activeStates.justifyCenter)} title="Căn giữa" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')}>
          <FontAwesomeIcon icon={faAlignCenter} />
        </button>
        <button type="button" className={btn(activeStates.justifyRight)} title="Căn phải" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')}>
          <FontAwesomeIcon icon={faAlignRight} />
        </button>
        <button type="button" className={btn(activeStates.justifyFull)} title="Căn đều" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyFull')}>
          <FontAwesomeIcon icon={faAlignJustify} />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" />

        <button type="button" className={btn(activeStates.insertUnorderedList)} title="Danh sách bullet" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button type="button" className={btn(activeStates.insertOrderedList)} title="Danh sách số" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')}>
          <FontAwesomeIcon icon={faListOl} />
        </button>
        <button type="button" className={btn(false)} title="Tăng lề" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('indent')}>
          <FontAwesomeIcon icon={faIndent} />
        </button>
        <button type="button" className={btn(false)} title="Giảm lề" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('outdent')}>
          <FontAwesomeIcon icon={faOutdent} />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" />

        <button type="button" className={btn(false)} title="Chèn liên kết" onMouseDown={(e) => e.preventDefault()} onClick={insertLink}>
          <FontAwesomeIcon icon={faLink} />
        </button>
        <button type="button" className={btn(false)} title="Chèn ảnh" onMouseDown={(e) => e.preventDefault()} onClick={insertImage}>
          <FontAwesomeIcon icon={faImage} />
        </button>

        <span className="mx-1 h-5 w-px bg-slate-300" />

        <button type="button" className={btn(false)} title="Hoàn tác (Ctrl+Z)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('undo')}>
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>
        <button type="button" className={btn(false)} title="Làm lại (Ctrl+Y)" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('redo')}>
          <FontAwesomeIcon icon={faRotateRight} />
        </button>
        <button type="button" className={btn(false)} title="Xóa định dạng" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')}>
          <FontAwesomeIcon icon={faRemoveFormat} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* EDITING SURFACE */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyUp={refreshActiveStates}
        onMouseUp={refreshActiveStates}
        className="rich-text-editor-surface prose max-w-none px-4 py-3 text-sm text-slate-900 leading-relaxed outline-none overflow-y-auto"
        style={{ minHeight: height, maxHeight: height * 2 }}
      />

      <style>{`
        .rich-text-editor-surface:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .rich-text-editor-surface ul { list-style: disc; padding-left: 1.4rem; margin: 0.4rem 0; }
        .rich-text-editor-surface ol { list-style: decimal; padding-left: 1.4rem; margin: 0.4rem 0; }
        .rich-text-editor-surface a { color: #4f46e5; text-decoration: underline; }
        .rich-text-editor-surface img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 0.4rem 0; }
        .rich-text-editor-surface h1, .rich-text-editor-surface h2, .rich-text-editor-surface h3 { font-weight: 700; margin: 0.5rem 0; }
      `}</style>
    </div>
  );
};

/** Escape attribute value để tránh vỡ HTML khi insertHTML */
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape text content */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
