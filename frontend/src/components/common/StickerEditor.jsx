import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
    X, Camera, Save, Pen, Type, Square, Circle, Triangle,
    Heart, Cloud, Star, Move, Trash2, Undo, Copy, ClipboardPaste,
    ArrowUp, ArrowDown, Redo,
} from "lucide-react";
import { Stage, Layer, Image as KonvaImage, Line, Text, Rect, Circle as KonvaCircle, Path, Transformer } from "react-konva";
import { useImage } from "react-konva-utils";

const SHAPES = [
    { id: 'rect', label: 'Rectangle' },
    { id: 'circle', label: 'Circle' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'heart', label: 'Heart' },
    { id: 'cloud', label: 'Cloud' },
    { id: 'star', label: 'Star' },
];

const StickerEditor = ({ onClose, onSave }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [hasImage, setHasImage] = useState(false);
    const [mode, setMode] = useState('move');
    const [penColor, setPenColor] = useState('#ffffff');
    const [penSize, setPenSize] = useState(4);
    const [textColor, setTextColor] = useState('#ffffff');
    const [textBgColor, setTextBgColor] = useState('transparent');
    const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);
    const [selectedShape, setSelectedShape] = useState('rect');
    const [lines, setLines] = useState([]);
    const [objects, setObjects] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [editingTextId, setEditingTextId] = useState(null);
    const [editingTextValue, setEditingTextValue] = useState('');
    const [clipboard, setClipboard] = useState(null);

    // Undo/Redo history
    const [history, setHistory] = useState([{ objects: [], lines: [] }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const isUndoRedo = useRef(false);

    const stageRef = useRef(null);
    const transformerRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const containerRef = useRef(null);
    const canvasWrapperRef = useRef(null);

    // Dynamic stage size
    const [stageSize, setStageSize] = useState({ width: 440, height: 440 });

    const [image, status] = useImage(imageUrl || '');

    // Resize handler
    useEffect(() => {
        const updateSize = () => {
            if (!canvasWrapperRef.current) return;
            const maxW = Math.min(canvasWrapperRef.current.offsetWidth - 2, 440); // 2px for border
            const maxH = Math.min(window.innerHeight * 0.5, 440); // Cap height to 50vh
            setStageSize({ width: maxW, height: maxH });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [hasImage]);

    // ---- Push current state to history ----
    const pushHistory = (newObjects, newLines) => {
        if (isUndoRedo.current) return;
        const snapshot = { objects: JSON.parse(JSON.stringify(newObjects)), lines: newLines };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(snapshot);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undoAction = () => {
        if (historyIndex <= 0) return;
        isUndoRedo.current = true;
        const newIndex = historyIndex - 1;
        const snapshot = history[newIndex];
        setObjects(JSON.parse(JSON.stringify(snapshot.objects)));
        setLines(snapshot.lines);
        setHistoryIndex(newIndex);
        setSelectedId(null);
        setTimeout(() => { isUndoRedo.current = false; }, 0);
    };

    const redoAction = () => {
        if (historyIndex >= history.length - 1) return;
        isUndoRedo.current = true;
        const newIndex = historyIndex + 1;
        const snapshot = history[newIndex];
        setObjects(JSON.parse(JSON.stringify(snapshot.objects)));
        setLines(snapshot.lines);
        setHistoryIndex(newIndex);
        setSelectedId(null);
        setTimeout(() => { isUndoRedo.current = false; }, 0);
    };

    // ---- Keyboard listeners ----
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!hasImage) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                if (selectedId) {
                    const obj = objects.find(o => o.id === selectedId);
                    if (obj) setClipboard({ ...obj });
                }
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (clipboard) {
                    const newId = `${clipboard.type}-${Date.now()}`;
                    const pasted = { ...clipboard, id: newId, x: clipboard.x + 20, y: clipboard.y + 20 };
                    const newObjects = [...objects, pasted];
                    setObjects(newObjects);
                    pushHistory(newObjects, lines);
                    setSelectedId(newId);
                    setTimeout(checkTransformer, 50);
                }
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                undoAction();
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                redoAction();
                e.preventDefault();
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId && editingTextId !== selectedId) {
                    deleteSelected();
                    e.preventDefault();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, clipboard, objects, lines, history, historyIndex, hasImage, editingTextId]);

    // Sync colour pickers with selected object
    useEffect(() => {
        if (!selectedId) return;
        const obj = objects.find(o => o.id === selectedId);
        if (!obj) return;
        if (obj.fill !== textColor) setTextColor(obj.fill || '#ffffff');
        if (obj.type === 'text') {
            const bg = obj.backgroundColor || 'transparent';
            if (bg !== textBgColor) setTextBgColor(bg);
        } else {
            const stroke = obj.stroke || '#ffffff';
            if (stroke !== textBgColor) setTextBgColor(stroke);
        }
        if (obj.type !== 'text' && obj.strokeWidth !== undefined) {
            setShapeStrokeWidth(obj.strokeWidth);
        }
    }, [selectedId, objects]);

    useEffect(() => {
        const updateSize = () => {
            if (!canvasWrapperRef.current) return;
            const maxW = Math.min(canvasWrapperRef.current.offsetWidth - 2, 440);
            const maxH = Math.min(window.innerHeight * 0.5, 440);
            setStageSize({ width: maxW, height: maxH });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [hasImage]);  // <-- important

    // ---- Image positioning ----
    const getImageProps = useCallback(() => {
        if (!image || status !== 'loaded') return null;
        const maxW = stageSize.width;
        const maxH = stageSize.height;
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        return { x: (maxW - width) / 2, y: (maxH - height) / 2, width, height };
    }, [image, status, stageSize]);

    const imageProps = getImageProps();

    const checkTransformer = () => {
        if (!transformerRef.current || !stageRef.current) return;
        const stage = stageRef.current;
        const node = stage.findOne(`#${selectedId}`);
        if (node) {
            transformerRef.current.nodes([node]);
            transformerRef.current.getLayer().batchDraw();
        } else {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    };

    const updateObject = (id, updates) => {
        setObjects(prev => {
            const newObjects = prev.map(obj => (obj.id === id ? { ...obj, ...updates } : obj));
            pushHistory(newObjects, lines);
            return newObjects;
        });
    };

    const sendForward = () => {
        if (!selectedId) return;
        const index = objects.findIndex(o => o.id === selectedId);
        if (index < objects.length - 1) {
            const newObjects = [...objects];
            [newObjects[index], newObjects[index + 1]] = [newObjects[index + 1], newObjects[index]];
            setObjects(newObjects);
            pushHistory(newObjects, lines);
            setTimeout(checkTransformer, 0);
        }
    };

    const sendBackward = () => {
        if (!selectedId) return;
        const index = objects.findIndex(o => o.id === selectedId);
        if (index > 0) {
            const newObjects = [...objects];
            [newObjects[index], newObjects[index - 1]] = [newObjects[index - 1], newObjects[index]];
            setObjects(newObjects);
            pushHistory(newObjects, lines);
            setTimeout(checkTransformer, 0);
        }
    };

    const startEditingText = (obj) => {
        setEditingTextId(obj.id);
        setEditingTextValue(obj.text);
    };
    const finishEditingText = () => {
        if (editingTextId && editingTextValue.trim()) {
            updateObject(editingTextId, { text: editingTextValue });
        }
        setEditingTextId(null);
        setEditingTextValue('');
    };

    const loadTestImage = () => {
        setImageUrl('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=440&h=440&fit=crop');
        setHasImage(true);
    };
    const loadImage = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result;
            if (typeof url === 'string') { setImageUrl(url); setHasImage(true); }
        };
        reader.readAsDataURL(file);
    };

    // ---- Touch & Mouse Drawing ----
    const getPointerPosition = (e) => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pos = stage.getPointerPosition();
        return pos;
    };

    const handlePointerDown = (e) => {
        if (mode !== 'pen') return;
        setIsDrawing(true);
        const pos = getPointerPosition(e);
        if (!pos) return;
        const newLine = { tool: 'pen', points: [pos.x, pos.y], color: penColor, strokeWidth: penSize };
        const newLines = [...lines, newLine];
        setLines(newLines);
        pushHistory(objects, newLines);
    };

    const handlePointerMove = (e) => {
        if (!isDrawing || mode !== 'pen') return;
        const pos = getPointerPosition(e);
        if (!pos) return;
        setLines(prev => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            const updated = { ...last, points: [...last.points, pos.x, pos.y] };
            return [...prev.slice(0, -1), updated];
        });
    };

    const handlePointerUp = () => {
        if (isDrawing) {
            pushHistory(objects, lines);
        }
        setIsDrawing(false);
    };

    // ---- Add text ----
    const addText = () => {
        const newObj = {
            id: `text-${Date.now()}`, type: 'text', x: stageSize.width / 2 - 50, y: stageSize.height / 2 - 20,
            text: 'Your Text', fontSize: Math.max(20, Math.min(40, stageSize.width / 10)),
            fill: textColor,
            backgroundColor: textBgColor === 'transparent' ? undefined : textBgColor,
            draggable: true,
            rotation: 0, scaleX: 1, scaleY: 1,
        };
        const newObjects = [...objects, newObj];
        setObjects(newObjects);
        pushHistory(newObjects, lines);
        setSelectedId(newObj.id);
        setMode('move');
    };

    // ---- Add shape ----
    const addShape = () => {
        const fill = textColor;
        const stroke = textBgColor === 'transparent' ? '#ffffff' : textBgColor;
        const baseSize = Math.min(stageSize.width, stageSize.height) * 0.25;
        const base = {
            id: `shape-${Date.now()}`, type: selectedShape, x: stageSize.width / 2 - baseSize / 2, y: stageSize.height / 2 - baseSize / 2,
            fill, stroke, strokeWidth: shapeStrokeWidth, draggable: true,
            rotation: 0, scaleX: 1, scaleY: 1,
        };
        switch (selectedShape) {
            case 'rect': base.width = baseSize; base.height = baseSize; break;
            case 'circle': base.radius = baseSize / 2; break;
            case 'triangle': base.width = baseSize; base.height = baseSize; break;
            case 'heart': base.width = baseSize * 0.8; base.height = baseSize * 0.8; break;
            case 'cloud': base.width = baseSize; base.height = baseSize * 0.8; break;
            case 'star': base.width = baseSize * 0.8; base.height = baseSize * 0.8; break;
        }
        const newObjects = [...objects, base];
        setObjects(newObjects);
        pushHistory(newObjects, lines);
        setSelectedId(base.id);
    };

    const deleteSelected = () => {
        if (selectedId) {
            const newObjects = objects.filter(o => o.id !== selectedId);
            setObjects(newObjects);
            pushHistory(newObjects, lines);
            setSelectedId(null);
        }
    };

    const undo = () => undoAction();

    const renderHeart = (props) => (
        <Path {...props} data="M 272.70141,206.64931 C 226.05689,150.45379 146.47221,141.55319 99.516391,196.50879 C 83.061052,215.70674 72.265899,241.29769 72.265899,267.69524 C 72.265899,308.31276 137.33378,364.5241 272.70141,440 C 408.06904,364.5241 473.13692,308.31276 473.13692,267.69524 C 473.13692,241.29769 462.34177,215.70674 445.88643,196.50879 C 398.9306,141.55319 319.34593,150.45379 272.70141,206.64931 z" />
    );
    const renderCloud = (props) => (
        <Path {...props} data="M 244.56,131.72 C 229.28,131.72 216.40,137.80 208.40,147.80 C 200.40,137.80 187.52,131.72 172.24,131.72 C 145.36,131.72 124.56,148.72 119.44,172.08 C 112.88,168.72 105.20,167.08 97.52,168.28 C 77.52,171.08 62.80,188.72 62.80,209.56 C 62.80,233.68 82.80,252.00 106.88,252.00 L 246.96,252.00 C 271.04,252.00 291.04,232.72 291.04,209.56 C 291.04,186.40 271.04,167.08 246.96,167.08 C 246.96,148.40 234.40,131.72 244.56,131.72 z" />
    );
    const renderStar = (props) => (
        <Path {...props} data="M 259.3,17.8 L 294,102.7 L 386,115.6 L 317,180.8 L 333,272.4 L 259.3,226.6 L 185.5,272.4 L 202,180.8 L 133,115.6 L 225,102.7 Z" />
    );

    const handleSave = () => {
        if (!stageRef.current) return;
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
        fetch(dataUrl).then(r => r.blob()).then(blob => { onSave(blob); onClose(); });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4"
        >
            <div className="bg-white rounded-2xl p-4 w-full max-w-[520px] max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-xl" ref={containerRef}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">Sticker Editor</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                {/* Canvas */}
                <div
                    className={`border rounded-lg overflow-hidden mb-3 ${!hasImage ? 'hidden' : ''}`}
                    ref={canvasWrapperRef}
                    style={{ width: stageSize.width, height: stageSize.height }}
                >
                    <Stage
                        ref={stageRef}
                        width={stageSize.width}
                        height={stageSize.height}
                        onMouseDown={handlePointerDown}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handlePointerMove}
                        onTouchEnd={handlePointerUp}
                        onClick={(e) => {
                            if (e.target === e.target.getStage()) setSelectedId(null);
                            checkTransformer();
                        }}
                        onTap={(e) => {
                            if (e.target === e.target.getStage()) setSelectedId(null);
                            checkTransformer();
                        }}
                    >
                        <Layer>
                            {status === 'loaded' && image && imageProps && (
                                <KonvaImage image={image} x={imageProps.x} y={imageProps.y} width={imageProps.width} height={imageProps.height} listening={false} />
                            )}
                            {lines.map((line, i) => (
                                <Line key={`line-${i}`} points={line.points} stroke={line.color} strokeWidth={line.strokeWidth} tension={0.5} lineCap="round" />
                            ))}
                            {objects.map(obj => {
                                const baseProps = {
                                    id: obj.id,
                                    x: obj.x,
                                    y: obj.y,
                                    fill: obj.fill,
                                    stroke: obj.stroke,
                                    strokeWidth: obj.strokeWidth,
                                    rotation: obj.rotation || 0,
                                    scaleX: obj.scaleX || 1,
                                    scaleY: obj.scaleY || 1,
                                    draggable: true,
                                    onClick: () => { setSelectedId(obj.id); checkTransformer(); },
                                    onTap: () => { setSelectedId(obj.id); checkTransformer(); },
                                    onTransformEnd: (e) => {
                                        const node = e.target;
                                        updateObject(obj.id, {
                                            x: node.x(),
                                            y: node.y(),
                                            rotation: node.rotation(),
                                            scaleX: node.scaleX(),
                                            scaleY: node.scaleY(),
                                        });
                                    },
                                    onDblClick: obj.type === 'text' ? () => startEditingText(obj) : undefined,
                                };
                                switch (obj.type) {
                                    case 'text': return <Text key={obj.id} {...baseProps} text={obj.text} fontSize={obj.fontSize} backgroundColor={obj.backgroundColor} />;
                                    case 'rect': return <Rect key={obj.id} {...baseProps} width={obj.width} height={obj.height} />;
                                    case 'circle': return <KonvaCircle key={obj.id} {...baseProps} radius={obj.radius} />;
                                    case 'triangle': return <Path key={obj.id} {...baseProps} data="M 0,100 L 50,0 L 100,100 Z" />;
                                    case 'heart': return renderHeart(baseProps);
                                    case 'cloud': return renderCloud(baseProps);
                                    case 'star': return renderStar(baseProps);
                                    default: return null;
                                }
                            })}
                            <Transformer ref={transformerRef} />
                        </Layer>
                    </Stage>
                </div>

                {/* Image selection */}
                {!hasImage && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <button onClick={loadTestImage} className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 flex items-center gap-2 w-full sm:w-auto justify-center">
                            <Camera className="w-5 h-5" /> Load Test Image
                        </button>
                        <div className="text-sm text-gray-400">— or —</div>
                        <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 flex items-center gap-2 w-full sm:w-auto justify-center">
                            <Camera className="w-5 h-5" /> Choose Photo
                        </button>
                        <button onClick={() => cameraInputRef.current?.click()} className="px-6 py-3 bg-blue-400 text-white rounded-xl font-medium hover:bg-blue-500 flex items-center gap-2 w-full sm:w-auto justify-center">
                            <Camera className="w-5 h-5" /> Take Photo
                        </button>
                        <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} className="hidden" />
                        <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} className="hidden" />
                    </div>
                )}

                {/* Text editing input */}
                {editingTextId && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-500 mb-2">Edit text:</p>
                        <div className="flex gap-2">
                            <input type="text" value={editingTextValue} onChange={(e) => setEditingTextValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') finishEditingText(); if (e.key === 'Escape') setEditingTextId(null); }} className="flex-1 px-3 py-2 bg-white rounded-lg text-sm focus:outline-none border" autoFocus />
                            <button onClick={finishEditingText} className="px-4 py-2 bg-blue-400 text-white rounded-lg text-sm font-medium hover:bg-blue-500">Save</button>
                            <button onClick={() => setEditingTextId(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                {hasImage && (
                    <>
                        <div className="flex items-center gap-1 sm:gap-2 mb-3 flex-wrap">
                            <button onClick={() => setMode('move')} className={`p-1.5 sm:p-2 rounded-lg ${mode === 'move' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100'}`} title="Move"><Move className="w-4 h-4" /></button>
                            <button onClick={() => setMode('pen')} className={`p-1.5 sm:p-2 rounded-lg ${mode === 'pen' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100'}`} title="Draw"><Pen className="w-4 h-4" /></button>
                            <button onClick={() => { setMode('text'); addText(); }} className={`p-1.5 sm:p-2 rounded-lg ${mode === 'text' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100'}`} title="Add Text"><Type className="w-4 h-4" /></button>
                            <button onClick={() => setMode('shape')} className={`p-1.5 sm:p-2 rounded-lg ${mode === 'shape' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100'}`} title="Add Shape"><Square className="w-4 h-4" /></button>
                            <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block" />
                            <button onClick={undo} className="p-1.5 sm:p-2 rounded-lg bg-gray-100" disabled={historyIndex === 0} title="Undo (Ctrl+Z)"><Undo className="w-4 h-4" /></button>
                            <button onClick={redoAction} className="p-1.5 sm:p-2 rounded-lg-gray-100" disabled={historyIndex === history.length - 1} title="Redo (Ctrl+Y)"><Redo className="w-4 h-4" /></button>
                            <button onClick={deleteSelected} className="p-1.5 sm:p-2 rounded-lg bg-gray-100" title="Delete (Del)"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={() => { if (selectedId) { const obj = objects.find(o => o.id === selectedId); if (obj) setClipboard({ ...obj }); } }} className="p-1.5 sm:p-2 rounded-lg bg-gray-100" title="Copy (Ctrl+C)"><Copy className="w-4 h-4" /></button>
                            <button onClick={() => { if (clipboard) { const newId = `${clipboard.type}-${Date.now()}`; const newObjects = [...objects, { ...clipboard, id: newId, x: clipboard.x + 20, y: clipboard.y + 20 }]; setObjects(newObjects); pushHistory(newObjects, lines); setSelectedId(newId); setTimeout(checkTransformer, 50); } }} className="p-1.5 sm:p-2 rounded-lg bg-gray-100" title="Paste (Ctrl+V)"><ClipboardPaste className="w-4 h-4" /></button>
                            <button onClick={sendForward} className="p-1.5 sm:p-2 rounded-lg bg-gray-100 disabled:opacity-40" disabled={!selectedId || objects.findIndex(o => o.id === selectedId) === objects.length - 1} title="Send Forward"><ArrowUp className="w-4 h-4" /></button>
                            <button onClick={sendBackward} className="p-1.5 sm:p-2 rounded-lg bg-gray-100 disabled:opacity-40" disabled={!selectedId || objects.findIndex(o => o.id === selectedId) === 0} title="Send Backward"><ArrowDown className="w-4 h-4" /></button>
                        </div>

                        {/* Pen options */}
                        {mode === 'pen' && (
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className="text-xs text-gray-500">Color:</span>
                                <input type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                                <span className="text-xs text-gray-500 ml-2">Size:</span>
                                <input type="range" min="1" max="20" value={penSize} onChange={(e) => setPenSize(Number(e.target.value))} className="w-24" />
                                <span className="text-xs">{penSize}px</span>
                            </div>
                        )}

                        {/* Shape mode */}
                        {mode === 'shape' && (
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <span className="text-xs text-gray-500">Shape:</span>
                                <select
                                    value={selectedShape}
                                    onChange={(e) => setSelectedShape(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 rounded-lg text-sm border focus:outline-none"
                                >
                                    {SHAPES.map(s => (
                                        <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                </select>
                                <button onClick={addShape} className="px-4 py-2 bg-blue-400 text-white rounded-lg text-sm font-medium hover:bg-blue-500">
                                    Add Shape
                                </button>
                            </div>
                        )}

                        {/* Color pickers + stroke width */}
                        {mode !== 'pen' && (
                            <div className="flex items-center gap-4 mb-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Fill:</span>
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => {
                                            const newColor = e.target.value;
                                            setTextColor(newColor);
                                            if (selectedId) updateObject(selectedId, { fill: newColor });
                                        }}
                                        className="w-8 h-8 rounded cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Background:</span>
                                    <input
                                        type="color"
                                        value={textBgColor === 'transparent' ? '#ffffff' : textBgColor}
                                        onChange={(e) => {
                                            const newBg = e.target.value;
                                            setTextBgColor(newBg);
                                            if (selectedId) {
                                                const obj = objects.find(o => o.id === selectedId);
                                                if (obj) {
                                                    if (obj.type === 'text') updateObject(selectedId, { backgroundColor: newBg });
                                                    else updateObject(selectedId, { stroke: newBg });
                                                }
                                            }
                                        }}
                                        className="w-8 h-8 rounded cursor-pointer"
                                    />
                                    <button
                                        onClick={() => {
                                            setTextBgColor('transparent');
                                            if (selectedId) {
                                                const obj = objects.find(o => o.id === selectedId);
                                                if (obj && obj.type === 'text') updateObject(selectedId, { backgroundColor: undefined });
                                            }
                                        }}
                                        className={`text-xs px-2 py-1 rounded ${textBgColor === 'transparent' ? 'bg-blue-100 text-blue-500' : 'bg-gray-100'}`}
                                    >
                                        None
                                    </button>
                                </div>
                                {selectedId && objects.find(o => o.id === selectedId)?.type !== 'text' && (
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-xs text-gray-500">Stroke:</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="20"
                                            value={shapeStrokeWidth}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                setShapeStrokeWidth(val);
                                                if (selectedId) updateObject(selectedId, { strokeWidth: val });
                                            }}
                                            className="w-20"
                                        />
                                        <span className="text-xs">{shapeStrokeWidth}px</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={handleSave} className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Sticker
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default StickerEditor;