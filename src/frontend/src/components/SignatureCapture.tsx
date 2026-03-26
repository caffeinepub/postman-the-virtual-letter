import { useEffect, useRef, useState } from "react";

interface Props {
  onSign: (signatureDataUrl: string) => void;
  onCancel?: () => void;
}

export default function SignatureCapture({ onSign, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffbf2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#4a2e1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    const { x, y } = getPos(canvas, e.clientX, e.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(canvas, e.clientX, e.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStrokes(true);
    e.preventDefault();
  }

  function endDraw() {
    isDrawing.current = false;
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    const touch = e.touches[0];
    const { x, y } = getPos(canvas, touch.clientX, touch.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getPos(canvas, touch.clientX, touch.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasStrokes(true);
    e.preventDefault();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffbf2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  }

  function submit() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    onSign(canvas.toDataURL("image/png"));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 8, 3, 0.88)" }}
      data-ocid="signature.modal"
    >
      <div
        className="w-full max-w-lg rounded-sm vintage-border"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.96 0.04 85), oklch(0.91 0.05 78))",
          boxShadow:
            "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <div className="text-center pt-8 pb-2 px-8">
          <div className="text-3xl mb-3">✉️</div>
          <h2
            className="font-playfair text-2xl font-bold leading-tight"
            style={{ color: "oklch(0.25 0.07 50)" }}
          >
            Sign to Receive Your Letter
          </h2>
          <p
            className="font-lora italic text-sm mt-2"
            style={{ color: "oklch(0.50 0.07 55)" }}
          >
            Draw your signature below to open your letter
          </p>
          <div
            className="mt-4 mx-auto w-16 h-px"
            style={{ background: "oklch(0.65 0.07 60)" }}
          />
        </div>

        <div className="px-8 pt-4 pb-2">
          <div
            className="relative border-2 rounded-sm overflow-hidden"
            style={{ borderColor: "oklch(0.72 0.06 65)" }}
          >
            <canvas
              ref={canvasRef}
              width={560}
              height={180}
              className="w-full cursor-crosshair block"
              style={{ touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={endDraw}
              data-ocid="signature.canvas_target"
            />
            {!hasStrokes && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none select-none">
                <p
                  className="font-lora italic text-sm opacity-40"
                  style={{ color: "oklch(0.42 0.10 48)" }}
                >
                  ✍ Sign here
                </p>
              </div>
            )}
          </div>
          <div
            className="h-px mx-2 mt-1"
            style={{ background: "oklch(0.65 0.07 60)" }}
          />
        </div>

        <div className="flex gap-3 px-8 pb-8 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              data-ocid="signature.cancel_button"
              className="flex-1 py-2.5 font-lora text-sm border-2 rounded-sm transition-all hover:brightness-95"
              style={{
                borderColor: "oklch(0.55 0.08 55)",
                color: "oklch(0.40 0.09 52)",
                background: "transparent",
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={clearCanvas}
            data-ocid="signature.secondary_button"
            className="flex-1 py-2.5 font-lora text-sm border-2 rounded-sm transition-all hover:brightness-95"
            style={{
              borderColor: "oklch(0.55 0.08 55)",
              color: "oklch(0.40 0.09 52)",
              background: "transparent",
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!hasStrokes}
            data-ocid="signature.submit_button"
            className="flex-[2] py-2.5 font-lora text-sm rounded-sm transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: hasStrokes
                ? "oklch(0.42 0.10 48)"
                : "oklch(0.72 0.06 55)",
              color: "oklch(0.97 0.02 80)",
            }}
          >
            Submit Signature
          </button>
        </div>
      </div>
    </div>
  );
}
