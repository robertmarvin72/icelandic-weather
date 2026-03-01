import React, { useEffect, useRef, useState } from "react";

/**
 * Adds a subtle pulse whenever `triggerKey` changes.
 * Use for decision pill / delta chip updates.
 */
export default function AnimatedPill({
  triggerKey,
  className = "",
  children,
  as: Tag = "span",
  ...props
}) {
  const prev = useRef(triggerKey);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prev.current !== triggerKey) {
      setPulse(true);
      prev.current = triggerKey;

      const t = setTimeout(() => setPulse(false), 260);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [triggerKey]);

  return (
    <Tag
      className={[
        className,
        "transition-transform duration-200 ease-out",
        pulse ? "scale-[1.04]" : "scale-100",
      ].join(" ")}
      {...props}
    >
      {children}
    </Tag>
  );
}
