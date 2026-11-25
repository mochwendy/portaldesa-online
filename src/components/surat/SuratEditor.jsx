import React, { useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo2, Redo2, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOOLS = [
  ['bold', Bold, 'Tebal'], ['italic', Italic, 'Miring'], ['underline', Underline, 'Garis bawah'],
  ['justifyLeft', AlignLeft, 'Rata kiri'], ['justifyCenter', AlignCenter, 'Tengah'],
  ['justifyRight', AlignRight, 'Rata kanan'], ['justifyFull', AlignJustify, 'Rata kiri-kanan'],
  ['insertUnorderedList', List, 'Daftar'], ['insertOrderedList', ListOrdered, 'Daftar nomor'],
  ['undo', Undo2, 'Urungkan'], ['redo', Redo2, 'Ulangi'],
];

export default function SuratEditor({ value, onChange, onReset }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || '';
  }, [value]);

  const exec = (cmd) => {
    ref.current?.focus();
    document.execCommand(cmd, false, null);
    onChange(ref.current.innerHTML);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/40">
        {TOOLS.map(([cmd, Icon, label]) => (
          <Button key={cmd} type="button" variant="ghost" size="icon" className="h-8 w-8" title={label}
            onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd)}>
            <Icon className="w-4 h-4" />
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5" /> Isi ulang dari template
        </Button>
      </div>
      <div className="bg-slate-100 p-4 max-h-[55vh] overflow-y-auto">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange(e.currentTarget.innerHTML)}
          className="bg-white mx-auto max-w-[680px] min-h-[300px] p-8 shadow outline-none"
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', lineHeight: 1.4 }}
        />
      </div>
    </div>
  );
}