import { cn } from "@/lib/utils";
import { Fragment, useEffect, useMemo, useState } from "react";

const PathwayBackground = () => {
  const [hovered_cell, set_hovered_cell] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [dimensions, set_dimensions] = useState({ width: 0, height: 0 });
  const grid_size = 50; // Size of each grid cell in pixels

  useEffect(() => {
    const update_dimensions = () => {
      if (typeof window !== "undefined") {
        set_dimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    update_dimensions();
    window.addEventListener("resize", update_dimensions);
    return () => window.removeEventListener("resize", update_dimensions);
  }, []);

  const num_columns = useMemo(
    () => Math.floor(dimensions.width / grid_size),
    [dimensions.width]
  );
  const num_rows = useMemo(
    () => Math.floor(dimensions.height / grid_size),
    [dimensions.height]
  );

  const handle_mouse_move = (event: React.MouseEvent<HTMLDivElement>) => {
    const x = Math.floor(event.clientX / grid_size);
    const y = Math.floor(event.clientY / grid_size);
    set_hovered_cell({ x, y });
  };

  const handle_mouse_leave = () => {
    set_hovered_cell(null);
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 overflow-hidden z-0"
        onMouseMove={handle_mouse_move}
        onMouseLeave={handle_mouse_leave}
      >
        {/* Grid cells */}
        {Array.from({ length: num_rows }).map((_, row) =>
          Array.from({ length: num_columns }).map((_, col) => (
            <div
              key={`cell-${row}-${col}`}
              className={cn(
                "absolute transition-colors duration-100",
                hovered_cell?.x === col && hovered_cell?.y === row
                  ? "bg-primary/50"
                  : ""
              )}
              style={{
                left: `${col * grid_size}px`,
                top: `${row * grid_size}px`,
                width: `${grid_size}px`,
                height: `${grid_size}px`,
              }}
            />
          ))
        )}

        {/* Vertical lines */}
        {Array.from({ length: num_columns + 1 }).map((_, i) => (
          <div
            key={`v${i}`}
            className="absolute top-0 w-[1px] h-full bg-gradient-to-t from-primary-foreground/50 from-35% via-primary-foreground/20 via-60% to-transparent to-100%"
            style={{
              left: `${i * grid_size}px`,
            }}
          />
        ))}

        {/* Horizontal lines */}
        {Array.from({ length: num_rows + 1 }).map((_, i) => (
          <div
            key={`h${i}`}
            className={`absolute left-0 w-full h-[1px] bg-primary-foreground/50`}
            style={{
              top: `${i * grid_size}px`,
            }}
          />
        ))}
      </div>
      <div className="fixed inset-0 z-1 pointer-events-none bg-gradient-to-t from-transparent from-50% to-background to-75%" />
    </Fragment>
  );
};

export default PathwayBackground;
